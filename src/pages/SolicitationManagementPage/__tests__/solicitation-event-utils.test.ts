import { describe, it, expect } from "vitest";
import { formatEventType } from "@/lib/solicitationEventUtils";

describe("formatEventType (QA #22 — events on solicitation overview)", () => {
  it("maps the known event-type slugs to their display labels", () => {
    expect(formatEventType("pre-bid-meeting")).toBe("Pre-bid Meeting");
    expect(formatEventType("technical-presentation")).toBe(
      "Technical Presentation",
    );
    expect(formatEventType("qa-session")).toBe("Q&A Session");
  });

  it("prettifies an unknown slug instead of showing it raw", () => {
    expect(formatEventType("site-visit")).toBe("Site Visit");
  });

  it("falls back to a generic label when the type is missing", () => {
    expect(formatEventType(undefined)).toBe("Event");
    expect(formatEventType("")).toBe("Event");
  });
});
