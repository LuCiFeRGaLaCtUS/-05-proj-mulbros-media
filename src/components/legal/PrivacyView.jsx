import React from 'react';
import { LegalPage } from './LegalPage';

const PRIVACY_MD = `
## 1. Who we are

AI Operator (the "Service") is operated by MulBros Media for internal use by the MulBros team and authorized collaborators. Contact: **Arghya@fsztpartners.com**.

## 2. What data we collect

We only collect data necessary to run the Service.

| Category | Examples | Why |
|---|---|---|
| Account | Email, phone, name, role, vertical | Authenticate you (via Stytch) and route you to the right workspace |
| Workflow | Auditions, tours, shows, releases, royalty statements, EPK content, team-chat messages | These are the records you create — we store them on your behalf |
| Integration tokens | OAuth tokens for Spotify, Stripe, Plaid, DocuSign, etc. | Required for the integration to function on your behalf |
| Usage telemetry | Tool-call latency, AI request token counts, request IDs | Operate the Service, detect outages, control cost |

We do **not** sell your data, run advertising on it, or share it with third parties for marketing.

## 3. Where data lives

| Vendor | Purpose | Region |
|---|---|---|
| Supabase | Primary database + auth | US (AWS) |
| Render | Application hosting | US |
| Stytch | Session auth | US |
| OpenAI / Anthropic | LLM responses (prompts forwarded only when you chat) | US |
| Langfuse | LLM observability (PII-scrubbed traces) | US |
| Sentry | Error tracking | US |
| Resend | Transactional email | US |
| Mux | Video upload + playback | US |
| Stripe / Plaid | Payments + bank connections | US |
| Twilio | SMS | US |

## 4. Encryption + access

- Transport: TLS 1.2+ everywhere
- Database: encrypted at rest by Supabase
- Auth tokens: short-lived JWTs (1 hour for app session, 10 min for service-role)
- Row-level security: every user table enforces \`user_id = auth.uid()\` — you can only read your own rows
- Personally-identifying fields (email, phone) are stripped from observability traces before leaving the server

## 5. Your rights

- **Access:** Email us — we'll export your data as JSON
- **Deletion:** Email us — we'll delete your profile + all associated rows within 30 days
- **Correction:** Edit via the app's Settings page, or email us
- **Data portability:** All your data is exportable as standard JSON
- **Withdraw consent:** You may stop using the Service at any time; deletion request above will remove residual data

## 6. Cookies + tracking

The Service uses only **strictly necessary** cookies (session token from Stytch). No third-party analytics or advertising cookies. If we add product analytics later, we'll update this policy and add a consent banner.

## 7. Children

The Service is not intended for users under 18. We do not knowingly collect data from minors.

## 8. International users

Data is stored in the US. By using the Service from outside the US, you consent to transfer of your data to the US.

## 9. Changes to this policy

We will post material changes here and notify active users by email. Continued use after a change constitutes acceptance.
`;

export const PrivacyView = () => (
  <LegalPage title="Privacy Policy" lastUpdated="2026-06-04" markdown={PRIVACY_MD} />
);

export default PrivacyView;
