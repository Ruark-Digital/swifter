// Solicitation event types are stored as slugs (see the Create Solicitation
// "Create Event" step's options: pre-bid-meeting / technical-presentation /
// qa-session). Map the known ones to their display labels, and prettify any
// unknown slug as a fallback so the overview never shows a raw "pre-bid-meeting".
const EVENT_TYPE_LABELS: Record<string, string> = {
  "pre-bid-meeting": "Pre-bid Meeting",
  "technical-presentation": "Technical Presentation",
  "qa-session": "Q&A Session",
};

export const formatEventType = (type?: string): string => {
  if (!type) return "Event";
  const known = EVENT_TYPE_LABELS[type];
  if (known) return known;
  return type
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
