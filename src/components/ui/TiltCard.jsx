import React, { useRef, useState, useCallback } from 'react';

/**
 * 3D tilt + amber spotlight card. Light theme, not dark.
 * Use on hero tiles only — costly at scale.
 *
 * Props:
 *   tiltLimit    — max rotation in degrees (default 8 — subtle)
 *   scale        — scale on hover (default 1.02)
 *   perspective  — px (default 1400 — shallow = subtle)
 *   effect       — 'evade' (tilt away) | 'gravitate' (tilt toward)
 *   spotlight    — show amber spotlight that follows cursor (default true)
 */
export const TiltCard = ({
  tiltLimit = 8,
  scale = 1.02,
  perspective = 1400,
  effect = 'evade',
  spotlight = true,
  className = '',
  style,
  children,
}) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState(
    `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
  );
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const dir = effect === 'evade' ? -1 : 1;

  const handlePointerMove = useCallback(
    (e) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const xRot = (py - 0.5) * (tiltLimit * 2) * dir;
      const yRot = (px - 0.5) * -(tiltLimit * 2) * dir;
      setTransform(
        `perspective(${perspective}px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale3d(${scale}, ${scale}, ${scale})`,
      );
      if (spotlight) setSpotlightPos({ x: px * 100, y: py * 100 });
    },
    [tiltLimit, scale, perspective, dir, spotlight],
  );

  const handlePointerEnter = useCallback(() => setIsHovered(true), []);
  const handlePointerLeave = useCallback(() => {
    setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
    setIsHovered(false);
  }, [perspective]);

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`will-change-transform relative overflow-hidden ${className}`}
      style={{
        transform,
        transition: 'transform 0.2s ease-out',
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }}
        >
          <div
            className="absolute w-[200%] h-[200%] rounded-full"
            style={{
              left: `${spotlightPos.x}%`,
              top: `${spotlightPos.y}%`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 25%, transparent 45%)',
            }}
          />
        </div>
      )}
    </div>
  );
};
