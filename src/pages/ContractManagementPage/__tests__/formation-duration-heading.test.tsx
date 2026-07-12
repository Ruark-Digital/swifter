import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Step4Timeline from "../components/Step4Timeline";
import Step3Timeline from "@/pages/MsaPage/components/Step3Timeline";

vi.mock("@adexdsamson/forge", () => ({
  Forger: () => null,
  useForgeValues: () => ({
    setValue: vi.fn(),
  }),
}));

vi.mock("react-hook-form", () => ({
  useWatch: () => undefined,
}));

describe("formation duration headings", () => {
  test("uses the updated contract formation duration heading for contracts", () => {
    render(<Step4Timeline termTypeOptions={[]} control={{} as any} />);

    expect(screen.getByText("Contract Formation Duration")).toBeInTheDocument();
    expect(
      screen.queryByText("Duration of Contract Formation Stage"),
    ).not.toBeInTheDocument();
  });

  test("uses the updated contract formation duration heading for MSA", () => {
    render(<Step3Timeline termTypeOptions={[]} control={{} as any} />);

    expect(screen.getByText("Contract Formation Duration")).toBeInTheDocument();
    expect(
      screen.queryByText(/Duration of Contract Formation\s+Stage/),
    ).not.toBeInTheDocument();
  });
});
