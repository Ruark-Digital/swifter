import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Step6ReviewPublish from "../components/Step6ReviewPublish";

// The lookup lists (types, categories, ...) are still loading.
vi.mock("@/lib/axiosInstance", () => ({ getRequest: () => new Promise(() => {}) }));

const TYPE_ID = "65f1c2a9e4b0a1b2c3d4e5f6";
const CATEGORY_ID = "65f1c2a9e4b0a1b2c3d4e5f7";

const Harness = () => {
  const { control } = useForm({
    defaultValues: { name: "Office lease", type: TYPE_ID, category: CATEGORY_ID },
  });
  return <Step6ReviewPublish control={control} />;
};

describe("contract review step labels", () => {
  it("never shows a raw id while the names are loading", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Harness />
      </QueryClientProvider>,
    );
    expect(screen.queryByText(TYPE_ID)).toBeNull();
    expect(screen.queryByText(CATEGORY_ID)).toBeNull();
    expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
  });
});
