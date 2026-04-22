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
    <Table
      className={cn("border-separate border-spacing-y-3", classNames?.table)}
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
  );

  const renderLoadingTable = (
    <Table className={cn("border-separate border-spacing-y-3", classNames?.table)}>
      <TableBody className={cn("bg-accent", classNames?.tHeader)}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <TableRow key={index}>
            {[1].map((_, index) => (
              <TableCell
                colSpan={columns.length}
                className="h-10 text-center w-full"
              >
                <Skeleton key={index} className="h-8 w-full bg-slate-300" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className={cn("w-full", classNames?.container ?? "")}>
      <div className="">
        {header && (
          <div className={cn("flex items-center py-4", classNames?.header)}>{header?.(table)}</div>
        )}

        {data.length > 0 && !options?.isLoading
          ? renderTable
          : options?.isLoading
          ? renderLoadingTable
          : emptyPlaceholder}
      </div>
      <div className="grid grid-cols-2 py-4 px-3">
        {!options?.disableSelection ? (
          <div className="flex-1 text-sm dark:text-gray-200 text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        ) : (
          <div></div>
        )}

        {!options?.disablePagination && (
          <Pagination
            className={cn(
              "justify-end pt-10 md:pt-0 lg:pt-0",
              classNames?.pagination
            )}
          >
            <PaginationContent
              className={cn("", classNames?.paginationContent)}
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
              ).map((page) =>
                typeof page === "string" ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
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
