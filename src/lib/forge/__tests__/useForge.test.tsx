import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, test } from "vitest";
import { Forge } from "../Forge";
import { Forger } from "../Forger";
import { useForge } from "../useForge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { Button } from "@/components/ui/button";

type FormState = {
  email: string;
};

const ProbeForm = () => {
  const [tick, setTick] = React.useState(0);
  const { control } = useForge<FormState>({
    defaultValues: {
      email: "",
    },
  });

  React.useEffect(() => {
    if (tick === 0) {
      setTick(1);
    }
  }, [tick]);

  return (
    <Forge control={control} onSubmit={() => {}}>
      <Forger
        name="email"
        label="Email"
        placeholder="Enter Email"
        component={TextInput}
      />
      <Button type="submit">Submit</Button>
      <span data-testid="tick">{tick}</span>
    </Forge>
  );
};

describe("useForge", () => {
  test("keeps the form mounted across a rerender without hitting an update loop", async () => {
    render(<ProbeForm />);

    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("tick")).toHaveTextContent("1");
    });
  });
});
