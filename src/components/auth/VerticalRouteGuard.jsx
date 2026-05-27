import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../../App';
import { VERTICALS } from '../../config/verticals';
import { getPersona, VERTICALS_BY_PERSONA } from '../../config/personas';

/**
 * Soft route guard for /vertical/:slug routes.
 *
 * Behavior:
 *   - admin role / no profile.vertical / showAllVerticals env → ALLOW any vertical
 *   - profile.vertical matches route → ALLOW
 *   - mismatch → REDIRECT to user's own vertical + toast
 *
 * Server-side enforcement still via Supabase RLS (per-row user_id = auth.uid()).
 * This guard is UX-only: keeps users out of workspaces they didn't sign up for.
 */
export const VerticalRouteGuard = ({ slug, children }) => {
  const { profile } = useAppContext();
  const navigate    = useNavigate();
  const params      = useParams();
  const requested   = slug || params.slug;

  useEffect(() => {
    if (!profile) return;

    const roles = profile.roles || [];
    const userVertical = profile.vertical;

    // Admin or no preference set → allow anything
    if (roles.includes('admin') || userVertical === 'admin' || !userVertical) return;

    // Validate vertical exists
    const requestedValid = VERTICALS.some(v => v.id === requested);
    if (!requestedValid) return; // unknown slug — let React Router 404 handle

    // Allow the user's whole persona group (e.g. director persona can visit
    // filmmaker + productions + crew + screenwriter).
    const persona = getPersona(profile);
    const allowed = VERTICALS_BY_PERSONA[persona] || [userVertical];
    if (allowed.includes(requested)) return;

    // Outside persona group → redirect to user's own vertical with toast
    const userVerticalLabel = VERTICALS.find(v => v.id === userVertical)?.label || userVertical;
    toast(`Switched to your workspace — ${userVerticalLabel}`, { icon: '🔒', duration: 3000 });
    navigate(`/vertical/${userVertical}`, { replace: true });
  }, [requested, profile, navigate]);

  return children;
};
