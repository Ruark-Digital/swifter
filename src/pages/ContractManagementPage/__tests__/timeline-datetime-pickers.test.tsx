import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Forge, useForge } from "@adexdsamson/forge";
import { useWatch } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import Step4Timeline from "../components/Step4Timeline";
import Step3Timeline from "../../MsaPage/components/Step3Timeline";
import { toContractDateTimeISO } from "@/lib/zonedDate";

// Real timeline steps (contract Step 4, MSA Step 3). The effective/end pickers
// carry a time; whatever is picked is a wall-clock date-time in the record's tz,
// which the wizards convert with toContractDateTimeISO on submit.
vi.mock("@/lib/axiosInstance", () => ({ getRequest: vi.fn() }));

const ZONE = "Pacific/Pago_Pago";

const Harness = ({ msa }: { msa?: boolean }) => {
  const { control } = useForge<any>({
    defaultValues: {
      effectiveDate: new Date(2027, 0, 10, 9, 0),
      endDate: new Date(2027, 6, 20, 17, 30),
    },
  });
  const effective = useWatch({ control, name: "effectiveDate" });
  const end = useWatch({ control, name: "endDate" });
  return (
    <Forge control={control}>
      {msa ? (
        <Step3Timeline control={control} termTypeOptions={[]} />
      ) : (
        <Step4Timeline control={control} termTypeOptions={[]} />
      )}
      <output data-testid="payload">
        {JSON.stringify({
          startDate: toContractDateTimeISO(effective, ZONE),
          endDate: toContractDateTimeISO(end, ZONE),
        })}
      </output>
    </Forge>
  );
};

describe.each([
  ["contract Step4Timeline", false],
  ["MSA Step3Timeline", true],
])("%s effective/end date-time pickers", (_name, msa) => {
  it("shows the date AND time, and submits both with the zone's offset", async () => {
    render(<Harness msa={msa} />);
    expect(await screen.findByText("Jan 10, 2027 09:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Jul 20, 2027 05:30 PM")).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId("payload").textContent!)).toEqual({
      startDate: "2027-01-10T09:00:00.000-11:00",
      endDate: "2027-07-20T17:30:00.000-11:00",
    });
  });

  it("changing the time in the picker changes the time that is sent", async () => {
    render(<Harness msa={msa} />);
    fireEvent.click(await screen.findByText("Jan 10, 2027 09:00 AM"));
    const time = await waitFor(() => {
      const el = document.body.querySelector('input[type="time"]');
      expect(el).toBeTruthy();
      return el as HTMLInputElement;
    });
    expect(time.value).toBe("09:00");
    fireEvent.change(time, { target: { value: "14:30" } });
    await waitFor(() =>
      expect(JSON.parse(screen.getByTestId("payload").textContent!).startDate).toBe(
        "2027-01-10T14:30:00.000-11:00",
      ),
    );
    expect(screen.getByText("Jan 10, 2027 02:30 PM")).toBeInTheDocument();
  });
});
