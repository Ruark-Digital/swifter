import React from "react";
import { SearchInput } from "@/components/layouts/SearchInput";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";

type HeaderProps = {
  title: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateFilter: string;
  statusFilter: string;
  onDateFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
};

const LinkedContractsHeader: React.FC<HeaderProps> = ({
  title,
  searchQuery,
  setSearchQuery,
  dateFilter,
  statusFilter,
  onDateFilterChange,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h2
              className="text-base font-semibold text-gray-600 dark:text-gray-400"
              style={{ fontFamily: "Quicksand" }}
            >
              {title}
            </h2>
          </div>
          <SearchInput
            placeholder="contract"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        <DropdownFilters
          filters={[
            {
              title: "Date",
              showIcon: true,
              options: [
                { label: "All", value: "all" },
                { label: "Today", value: "today" },
                { label: "Last 7 Days", value: "last7days" },
                { label: "Last 30 Days", value: "last30days" },
                { label: "Custom", value: "custom" },
              ],
            },
            {
              title: "Status",
              showIcon: true,
              options: [
                { label: "Active", value: "active" },
                { label: "Draft", value: "draft" },
                { label: "Expired", value: "expired" },
              ],
            },
          ]}
          onFilterChange={(filterTitle, value) => {
            if (filterTitle === "Date") {
              onDateFilterChange(value);
            } else if (filterTitle === "Status") {
              onStatusFilterChange(value);
            }
          }}
          selectedValues={{
            Date: dateFilter,
            Status: statusFilter,
          }}
        />
      </div>
    </div>
  );
};

export default LinkedContractsHeader;
