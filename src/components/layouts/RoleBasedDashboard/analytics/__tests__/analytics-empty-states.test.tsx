import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ClauseIntelligenceCard } from "../ClauseIntelligenceCard";
import { ComplianceStatusCard } from "../ComplianceStatusCard";
import { ContractStatusCard } from "../ContractStatusCard";
import { CycleTimeCard } from "../CycleTimeCard";
import { InvoiceStatusCard } from "../InvoiceStatusCard";
import { RenewalsTimelineCard } from "../RenewalsTimelineCard";
import { RiskDistributionCard } from "../RiskDistributionCard";
import { VendorPerformanceSummaryCard } from "../VendorPerformanceSummaryCard";

// Every value that used to be hardcoded as a fallback in these cards. None of
// them may ever reach the screen again — with no API data the cards must show
// an empty state, not invented numbers.
const DEMO_VALUES = [
  "142", "145", "138", "98", "95", "89", "23", // ComplianceStatusCard
  "12", "24", "54", "120", // ContractStatusCard
  "34", // Invoice / Risk
  "5 days", "8 days", "12 days", "6 days", // CycleTimeCard
];

const DEMO_TEXT = [
  "AWS Cloud Services",
  "Office Lease Agreement",
  "Software Licenses",
  "BlueCorp Industries",
  "BuildCorp Ltd",
  "TechServices Inc",
  "Global Consulting",
  "Equipment Supplier",
  "Liquidated Damages",
  "Termination Rights",
  "Warranties",
  "Payment Terms",
];

describe("dashboard analytics cards render empty, never demo data", () => {
  test("ComplianceStatusCard", () => {
    render(<ComplianceStatusCard />);
    expect(screen.getByText("No compliance data yet")).toBeInTheDocument();
    for (const v of ["142", "145", "138", "89", "23"]) {
      expect(screen.queryByText(new RegExp(`\\b${v}\\b`))).toBeNull();
    }
  });

  test("ContractStatusCard", () => {
    render(<ContractStatusCard />);
    expect(screen.getByText("No contract data yet")).toBeInTheDocument();
    expect(screen.queryByText("120")).toBeNull();
  });

  test("InvoiceStatusCard", () => {
    render(<InvoiceStatusCard />);
    expect(screen.getByText("No invoice data yet")).toBeInTheDocument();
    expect(screen.queryByText("98")).toBeNull();
  });

  test("RiskDistributionCard", () => {
    render(<RiskDistributionCard />);
    expect(screen.getByText("No risk data yet")).toBeInTheDocument();
    expect(screen.queryByText("34")).toBeNull();
  });

  test("CycleTimeCard", () => {
    render(<CycleTimeCard />);
    expect(screen.getByText("No cycle time data yet")).toBeInTheDocument();
    expect(screen.queryByText("12 days")).toBeNull();
  });

  test("RenewalsTimelineCard", () => {
    render(<RenewalsTimelineCard />);
    expect(screen.getByText("No upcoming renewals")).toBeInTheDocument();
    expect(screen.queryByText("AWS Cloud Services")).toBeNull();
    expect(screen.queryByText(/BlueCorp Industries/)).toBeNull();
  });

  test("VendorPerformanceSummaryCard", () => {
    render(<VendorPerformanceSummaryCard />);
    expect(
      screen.getByText("No vendor performance data yet"),
    ).toBeInTheDocument();
    expect(screen.queryByText("BuildCorp Ltd")).toBeNull();
    expect(screen.queryByText("TechServices Inc")).toBeNull();
  });

  test("ClauseIntelligenceCard", () => {
    render(<ClauseIntelligenceCard />);
    expect(screen.getByText("No clause data yet")).toBeInTheDocument();
    expect(screen.queryByText("Liquidated Damages")).toBeNull();
    expect(screen.queryByText("Warranties")).toBeNull();
  });

  test("no demo string from any card leaks into the empty tab", () => {
    const { container } = render(
      <>
        <ClauseIntelligenceCard />
        <ComplianceStatusCard />
        <ContractStatusCard />
        <CycleTimeCard />
        <InvoiceStatusCard />
        <RenewalsTimelineCard />
        <RiskDistributionCard />
        <VendorPerformanceSummaryCard />
      </>,
    );

    for (const text of DEMO_TEXT) {
      expect(container.textContent).not.toContain(text);
    }
    for (const value of DEMO_VALUES.filter((v) => v.includes("days"))) {
      expect(container.textContent).not.toContain(value);
    }
  });
});

describe("cards still render real API data", () => {
  test("ContractStatusCard shows supplied counts", () => {
    render(<ContractStatusCard data={{ active: 3, draft: 1 }} />);
    expect(screen.queryByText("No contract data yet")).toBeNull();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("CycleTimeCard shows supplied stage durations", () => {
    render(
      <CycleTimeCard
        values={{ draft: 2, review: 4, approval: 7, execution: 1 }}
      />,
    );
    expect(screen.queryByText("No cycle time data yet")).toBeNull();
    expect(screen.getByText("7 days")).toBeInTheDocument();
  });

  test("VendorPerformanceSummaryCard shows supplied rows", () => {
    render(
      <VendorPerformanceSummaryCard
        data={{ rows: [{ vendor: "Acme Ltd", contracts: 2, riskScore: 10 }] }}
      />,
    );
    expect(screen.queryByText("No vendor performance data yet")).toBeNull();
    expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
  });

  // QA #110: the BE now returns `overallKpi` (0 = not rated) and defaults the
  // `performance` band to "bad" for un-rated vendors. The dot must stay neutral
  // until a vendor is actually rated (overallKpi > 0) — the same "bad" band is
  // grey when unrated and red once rated.
  test("VendorPerformanceSummaryCard gates the dot on overallKpi", () => {
    render(
      <VendorPerformanceSummaryCard
        data={{
          rows: [
            { vendor: "Unrated Co", overallKpi: 0, performance: "bad" },
            { vendor: "Rated Bad Co", overallKpi: 30, performance: "bad" },
            { vendor: "Rated Good Co", overallKpi: 85, performance: "good" },
          ],
        }}
      />,
    );
    expect(screen.getByTitle("Performance not yet rated")).toBeInTheDocument();
    expect(screen.getByTitle("Low performance")).toBeInTheDocument();
    expect(screen.getByTitle("High performance")).toBeInTheDocument();
  });
});
