// Shared avatar helpers for the presence indicators. Kept in a non-component
// module so PresenceBar / IframePresenceBar stay fast-refresh-friendly (a
// component file that also exports plain functions trips react-refresh).

export const AVATAR_TONES = [
  { bg: "#EEF2FF", fg: "#4338CA" },
  { bg: "#ECFDF5", fg: "#047857" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#FCE7F3", fg: "#BE185D" },
  { bg: "#E0F2FE", fg: "#0369A1" },
  { bg: "#F3E8FF", fg: "#7E22CE" },
];

/** Up-to-two-letter initials from a name (or email local-part). */
export const initialsOf = (name: string): string => {
  const parts = (name || "")
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Stable avatar tone for a key (name), hashed into the palette. */
export const toneFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
};
