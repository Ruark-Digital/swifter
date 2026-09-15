import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  Table as TableType,
  VisibilityState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DataTableOptions<T = unknown> = {
  disablePagination: boolean;
  disableSelection: boolean;
  isLoading: boolean;
  totalCounts: number;
  manualPagination: boolean;
  setPagination: OnChangeFn<PaginationState>;
  pagination: PaginationState;
  // Custom metadata to pass into TanStack Table
  meta?: any;
  // Expansion-related options
  enableExpanding?: boolean;
  getSubRows?: (originalRow: T, index: number) => T[] | undefined;
  getRowCanExpand?: (row: Row<T>) => boolean;
  renderSubComponent?: (props: { row: Row<T> }) => ReactNode;
  paginateExpandedRows?: boolean;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  // Optional: per-row className customization
  getRowClassName?: (row: Row<T>) => string;
  // Opt-in: below the `sm` breakpoint, render each row as a stacked card
  // (first column as the card title, remaining columns as labelled fields,
  // an "actions" column as a full-width footer) instead of a horizontally
  // scrolling table row. The desktop table is unchanged. Cells are rendered
  // with the same column defs via flexRender, so badges/links/buttons work.
  mobileCards?: boolean;
};

type ClassNames = {
  table?: string;
  tHeader?: string;
  tRow?: string;
  tHeadRow?: string;
  header?: string;
  tBody?: string;
  tCell?: string;
  tHead?: string;
  container?: string;
  pagination?: string;
  paginationItem?: string;
  paginationLink?: string;
  paginationNext?: string;
  paginationContent?: string;
  paginationActiveLink?: string;
  paginationPrevious?: string;
  paginationEllipsis?: string;
  paginationItemDisabled?: string;
  paginationLinkDisabled?: string;
  expandedRow?: string;
  expandedCell?: string;
};

type DataTableProps<T = unknown> = {
  data: T[];
  columns: ColumnDef<T>[];
  header?: (value: TableType<T>) => ReactNode;
  options?: Partial<DataTableOptions<T>>;
  classNames?: ClassNames;
  emptyPlaceholder?: ReactNode;
};

export function DataTable<T = unknown>({
  data,
  columns,
  header,
  options,
  classNames,
  emptyPlaceholder,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    onPaginationChange: options?.setPagination,
    onSortingChange: setSorting,
    rowCount: options?.totalCounts,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: options?.meta,
    // Expansion configuration
    enableExpanding: options?.enableExpanding ?? false,
    getExpandedRowModel: options?.enableExpanding ? getExpandedRowModel() : undefined,
    getSubRows: options?.getSubRows,
    getRowCanExpand: options?.getRowCanExpand,
    paginateExpandedRows: options?.paginateExpandedRows ?? true,
    onExpandedChange: options?.onExpandedChange ?? setExpanded,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded: options?.expanded ?? expanded,
      pagination: options?.pagination ?? { pageIndex: 0, pageSize: 10 },
    },
  });

  const activePage = table?.getState()?.pagination?.pageIndex + 1;
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  const renderTable = (
    <div
      className="overflow-x-auto -mx-1 px-1"
      style={{ width: "1px", minWidth: "100%" }}
    >
    <Table
      className={cn("border-separate border-spacing-y-3 min-w-max", classNames?.table)}
    >
      <TableHeader className={cn("bg-accent", classNames?.tHeader)}>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow className={cn(classNames?.tHeadRow)} key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  className={cn("h-10", classNames?.tHead)}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length && !options?.isLoading
          ? table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                {/* Main row */}
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "bg-white dark:bg-slate-950 px-3",
                    classNames?.tRow,
                    options?.getRowClassName?.(row)
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className={cn(
                        "p-2 pl-4 text-gray-900 dark:text-gray-200",
                        classNames?.tCell
                      )}
                      key={cell.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Expanded row content */}
                {row.getIsExpanded() && options?.renderSubComponent && (
                  <TableRow
                    className={cn(
                      "bg-white dark:bg-slate-950",
                      classNames?.expandedRow
                    )}
                  >
                    <TableCell
                      colSpan={row.getAllCells().length}
                      className={cn(
                        "p-0",
                        classNames?.expandedCell
                      )}
                    >
                      {options.renderSubComponent({ row })}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          : null}
      </TableBody>
    </Table>
    </div>
  );

  const renderLoadingTable = (
    <Table className={cn("border-separate border-spacing-y-3", classNames?.table)}>
      <TableBody className={cn("bg-accent", classNames?.tHeader)}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <TableRow key={index}>
            {[1].map((_, cellIndex) => (
              <TableCell
                key={cellIndex}
                colSpan={columns.length}
                className="h-10 text-center w-full"
              >
                <Skeleton className="h-8 w-full bg-slate-300" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // Mobile card list (opt-in via options.mobileCards). Each row renders as a
  // self-contained card so a wide table never runs past a phone's viewport:
  // the first column is the card title, an "actions" column becomes a footer,
  // and every other column is a labelled field.
  const renderMobileCards = (
    <div className="flex flex-col gap-3 py-2">
      {table.getRowModel().rows.map((row) => {
        const cells = row.getVisibleCells();
        const [titleCell, ...restCells] = cells;
        const fieldCells = restCells.filter((c) => c.column.id !== "actions");
        const actionCells = restCells.filter((c) => c.column.id === "actions");
        return (
          <React.Fragment key={row.id}>
            <div
              className={cn(
                "rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-3",
                options?.getRowClassName?.(row)
              )}
            >
              {titleCell && (
                <div className="min-w-0">
                  {flexRender(
                    titleCell.column.columnDef.cell,
                    titleCell.getContext()
                  )}
                </div>
              )}
              {fieldCells.length > 0 && (
                <dl className="flex flex-col gap-2">
                  {fieldCells.map((cell) => {
                    const header = cell.column.columnDef.header;
                    const label =
                      typeof header === "string" ? header : null;
                    return (
                      <div
                        key={cell.id}
                        className="flex items-start justify-between gap-3"
                      >
                        {label && (
                          <dt className="shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                            {label}
                          </dt>
                        )}
                        <dd className="ml-auto min-w-0 text-right text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
              {actionCells.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                  {actionCells.map((cell) => (
                    <React.Fragment key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            {row.getIsExpanded() && options?.renderSubComponent && (
              <div
                className={cn(
                  "overflow-x-auto rounded-xl border border-gray-200 p-2 dark:border-slate-700",
                  classNames?.expandedCell
                )}
              >
                {options.renderSubComponent({ row })}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderMobileLoading = (
    <div className="flex flex-col gap-3 py-2">
      {[1, 2, 3, 4].map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 p-4 dark:border-slate-700"
        >
          <Skeleton className="h-6 w-2/3 bg-slate-300" />
          <Skeleton className="mt-3 h-4 w-full bg-slate-300" />
          <Skeleton className="mt-2 h-4 w-1/2 bg-slate-300" />
        </div>
      ))}
    </div>
  );

  const hasRows = data.length > 0 && !options?.isLoading;

  return (
    <div className={cn("w-full min-w-0", classNames?.container ?? "")}>
      <div className="">
        {header && (
          <div className={cn("flex items-center py-4", classNames?.header)}>{header?.(table)}</div>
        )}

        {options?.mobileCards ? (
          <>
            <div className="hidden sm:block">
              {hasRows
                ? renderTable
                : options?.isLoading
                ? renderLoadingTable
                : emptyPlaceholder}
            </div>
            <div className="sm:hidden">
              {hasRows
                ? renderMobileCards
                : options?.isLoading
                ? renderMobileLoading
                : emptyPlaceholder}
            </div>
          </>
        ) : hasRows ? (
          renderTable
        ) : options?.isLoading ? (
          renderLoadingTable
        ) : (
          emptyPlaceholder
        )}
      </div>
      <div className="flex flex-col gap-3 py-4 px-3 sm:grid sm:grid-cols-2 sm:gap-0">
        {!options?.disableSelection ? (
          <div className="flex-1 text-sm dark:text-gray-200 text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        ) : (
          <div className="hidden sm:block"></div>
        )}

        {!options?.disablePagination && (
          <Pagination
            className={cn(
              "justify-center sm:justify-end",
              classNames?.pagination
            )}
          >
            <PaginationContent
              className={cn("flex-wrap justify-center", classNames?.paginationContent)}
            >
              <PaginationItem>
                <PaginationPrevious
                  className={cn(
                    "dark:text-gray-200",
                    !canPreviousPage && "pointer-events-none opacity-50",
                    classNames?.paginationPrevious,
                    !canPreviousPage && classNames?.paginationLinkDisabled
                  )}
                  data-testid="previous-page"
                  onClick={() => {
                    if (canPreviousPage) {
                      table.previousPage();
                    }
                  }}
                />
              </PaginationItem>

              {createPageNumbers(
                table.getPageCount(),
                table.getState().pagination.pageIndex + 1
              ).map((page, index) =>
                typeof page === "string" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={activePage === page}
                      onClick={() => table.setPageIndex(page - 1)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  className={cn(
                    "dark:text-gray-200",
                    !canNextPage && "pointer-events-none opacity-50",
                    classNames?.paginationNext,
                    !canNextPage && classNames?.paginationLinkDisabled
                  )}
                  data-testid="next-page"
                  onClick={() => {
                    if (canNextPage) {
                      table.nextPage();
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

const createPageNumbers = (totalPages: number, currentPage: number) => {
  const pageNumbers = [];
  const pageRangeDisplayed = 2; // Number of pages to display around the current page
  //  const breakPoint = 2; // When to show breaklines

  // Generate the page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // Always show the first page
      i === totalPages || // Always show the last page
      (i >= currentPage - pageRangeDisplayed &&
        i <= currentPage + pageRangeDisplayed) // Show pages around the current page
    ) {
      pageNumbers.push(i);
    } else if (
      (i === 2 || i === totalPages - 1) && // Show second and second last page if breakline exists
      pageNumbers[pageNumbers.length - 1] !== "..."
    ) {
      pageNumbers.push("...");
    }
  }

  return pageNumbers;
};

// Utility functions for common expansion scenarios

/**
 * Helper function to create an expansion toggle button for a column
 * @param row The row object from TanStack Table
 * @returns ReactNode for the expand/collapse button
 */
export function createExpandButton<T>(row: Row<T>) {
  if (!row.getCanExpand()) {
    return null;
  }

  return (
    <button
      onClick={row.getToggleExpandedHandler()}
      className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {row.getIsExpanded() ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

/**
 * Helper function to check if row data has children for expansion
 * @param originalRow The original data row
 * @param childrenKey The key to check for sub-rows (default: 'children')
 * @returns boolean indicating if the row can expand
 */
export function hasChildren(originalRow: any, childrenKey: string = 'children'): boolean {
  return originalRow && Array.isArray(originalRow[childrenKey]) && originalRow[childrenKey].length > 0;
}

/**
 * Helper function to get sub-rows from data
 * @param originalRow The original data row
 * @param childrenKey The key containing sub-rows (default: 'children')
 * @returns Array of sub-rows or undefined
 */
export function getSubRows(originalRow: any, childrenKey: string = 'children'): any[] | undefined {
  return originalRow?.[childrenKey];
}
