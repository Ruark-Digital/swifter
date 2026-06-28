import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, test, vi } from "vitest";
import ContractsTable from "../components/ContractsTable";

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    isManager: true,
  }),
}));

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({
    _id: "user-1",
  }),
}));

vi.mock("../components/EditContract", () => ({
  default: () => null,
}));

vi.mock("../components/ContractLifecycleDialog", () => ({
  default: () => null,
}));

vi.mock("../components/EmptyState", () => ({
  default: () => <div>Empty</div>,
}));

vi.mock("@/components/layouts/SolicitationFilters", () => ({
  DropdownFilters: () => null,
}));

vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{ to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: ({ data, columns, header }: any) => (
    <div>
      {header?.()}
      {data.map((row: any) => (
        <div key={row.id}>
          {columns.map((column: any, index: number) => {
            if (!column.cell) {
              return null;
            }

            const value = column.accessorKey ? row[column.accessorKey] : undefined;

            return (
              <div key={`${row.id}-${index}`}>
                {column.cell({
                  row: { original: row },
                  getValue: () => value,
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", async () => {
  const React = await import("react");

  const DropdownMenuContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  } | null>(null);

  const useDropdownMenuContext = () => {
    const value = React.useContext(DropdownMenuContext);
    if (!value) {
      throw new Error("DropdownMenu context missing");
    }
    return value;
  };

  return {
    DropdownMenu: ({
      open = false,
      onOpenChange = () => {},
      children,
    }: {
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      children: React.ReactNode;
    }) => (
      <DropdownMenuContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DropdownMenuContext.Provider>
    ),
    DropdownMenuTrigger: ({
      asChild,
      children,
    }: {
      asChild?: boolean;
      children: React.ReactElement<{ onClick?: () => void }>;
    }) => {
      const { open, onOpenChange } = useDropdownMenuContext();
      if (asChild) {
        return React.cloneElement(children, {
          onClick: () => onOpenChange(!open),
        });
      }
      return <button type="button" onClick={() => onOpenChange(!open)}>{children}</button>;
    },
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => {
      const { open } = useDropdownMenuContext();
      return open ? <div role="menu">{children}</div> : null;
    },
    DropdownMenuItem: ({
      children,
      asChild,
      onSelect,
      ...props
    }: React.PropsWithChildren<{
      asChild?: boolean;
      onSelect?: (event: { preventDefault: () => void }) => void;
    }>) => {
      const handleSelect = () => onSelect?.({ preventDefault: () => {} });

      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, props);
      }

      return (
        <button type="button" role="menuitem" onClick={handleSelect} {...props}>
          {children}
        </button>
      );
    },
  };
});

describe("ContractsTable actions menu", () => {
  test("keeps only one row action menu open at a time", () => {
    render(
      <ContractsTable
        rows={[
          {
            id: "c-1",
            contractId: "COND1",
            title: "Contract One",
            code: "COND1",
            vendor: "Vendor A",
            owner: "Owner A",
            status: "Draft",
            isOwner: false,
          },
          {
            id: "c-2",
            contractId: "COND2",
            title: "Contract Two",
            code: "COND2",
            vendor: "Vendor B",
            owner: "Owner B",
            status: "Draft",
            isOwner: false,
          },
        ]}
      />,
    );

    const triggers = screen.getAllByTestId("project-actions-dropdown");
    fireEvent.click(triggers[0]);
    expect(screen.getAllByText("View Contract")).toHaveLength(1);

    fireEvent.click(triggers[1]);
    expect(screen.getAllByText("View Contract")).toHaveLength(1);
  });
});
