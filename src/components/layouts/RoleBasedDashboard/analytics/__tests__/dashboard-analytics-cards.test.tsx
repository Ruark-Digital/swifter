import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { SpendCard } from "../SpendCard";
import { RenewalsTimelineCard } from "../RenewalsTimelineCard";

describe("dashboard analytics cards", () => {
  test("formats committed vs actual spend with one decimal compact values", () => {
    render(
      <SpendCard committed={12000000} actual={5400000} currency="USD" />,
    );

    expect(screen.getByText("$12.0M")).toBeInTheDocument();
    expect(screen.getByText("$5.4M")).toBeInTheDocument();
    expect(screen.getByText("$6.6M")).toBeInTheDocument();
  });

  test("renders a full-height timeline marker for each renewal row", () => {
    render(
      <RenewalsTimelineCard
        data={{
          timeline: [
            {
              contractTitle: "AWS Cloud Services",
              vendor: "BlueCorp Industries",
              contractCode: "CON-2024-001",
              value: 2500000,
              daysToExpiry: 30,
              timelineStatus: "critical",
              label: "Expires in 30 days",
            },
            {
              contractTitle: "Office Lease Agreement",
              vendor: "BlueCorp Industries",
              contractCode: "CON-2024-002",
              value: 1200000000,
              daysToExpiry: 60,
              timelineStatus: "warning",
              label: "Expires in 60 days",
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByTestId("renewal-timeline-line")).toHaveLength(2);
    expect(screen.getByText("$2.5M")).toBeInTheDocument();
    expect(screen.getByText("$1.2B")).toBeInTheDocument();
  });
});
