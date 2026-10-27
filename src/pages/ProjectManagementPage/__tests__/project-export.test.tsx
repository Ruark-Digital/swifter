import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ProjectManagementPage from "../index";
import { useProjectsList } from "../services/useProjectApi";

const mockedWriteFile = vi.fn();

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({ sheet: true })),
    book_new: vi.fn(() => ({ workbook: true })),
    book_append_sheet: vi.fn(),
  },
  writeFile: (...args: unknown[]) => mockedWriteFile(...args),
}));

vi.mock("../services/useProjectApi", () => ({
  useProjectsList: vi.fn(),
  useProjectsStats: () => ({ data: { data: { all: 1, active: 1, completed: 0 } } }),
  useCreateProject: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/store/authSlice", () => ({ useUser: () => ({ currency: "USD" }) }));
vi.mock("@/components/SEO", () => ({ SEOWrapper: () => null }));

// Stub the heavy child components — the export button lives on the page itself.
vi.mock("../components/StatsCards", () => ({ default: () => <div /> }));
vi.mock("../components/ProjectsTable", () => ({ default: () => <div data-testid="projects-table" /> }));
vi.mock("../components/EmptyState", () => ({ default: () => <div data-testid="empty-state" /> }));
vi.mock("../components/CreateProjectDialog", () => ({ default: () => <div /> }));
vi.mock("../components/SuccessAlert", () => ({ default: () => <div /> }));

const mockedUseProjectsList = vi.mocked(useProjectsList);

describe("Project Management export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("exports the loaded projects to xlsx", () => {
    mockedUseProjectsList.mockReturnValue({
      data: {
        data: [
          {
            _id: "p1",
            name: "Bearpaw Lake Mine Expansion",
            budget: 1000,
            totalSpend: 250,
            eac: 1200,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            status: "active",
          },
        ],
      },
      isLoading: false,
    } as never);

    render(<ProjectManagementPage />);

    const exportButton = screen.getByRole("button", { name: "Export projects" });
    expect(exportButton).toBeEnabled();

    fireEvent.click(exportButton);

    expect(mockedWriteFile).toHaveBeenCalledTimes(1);
    expect(mockedWriteFile.mock.calls[0]?.[1]).toMatch(/^projects-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  test("disables export when there are no projects", () => {
    mockedUseProjectsList.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    } as never);

    render(<ProjectManagementPage />);

    expect(screen.getByRole("button", { name: "Export projects" })).toBeDisabled();
  });
});
