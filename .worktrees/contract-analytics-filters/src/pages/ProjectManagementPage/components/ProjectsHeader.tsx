import React from "react";
import { SearchInput } from "@/components/layouts/SearchInput";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";

type HeaderProps = {
  title: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateFilter: string;
  statusFilter: string;
  categoryFilter: string;
  onDateFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
};

const ProjectsHeader: React.FC<HeaderProps> = ({
  title,
  searchQuery,
  setSearchQuery,
  dateFilter,
  statusFilter,
  categoryFilter,
  onDateFilterChange,
  onStatusFilterChange,
  onCategoryFilterChange,
}) => {
  return (
    <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-600 dark:text-gray-400" style={{ fontFamily: "Quicksand" }}>
              {title}
            </h2>
          </div>
          <SearchInput
            placeholder="project"
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
                {
                  hasOptions: true,
                  value: "date",
                  label: "Date",
                  subOptions: [
                    { title: "All", value: "all" },
                    { title: "Today", value: "today" },
                    { title: "Last 7 Days", value: "last7days" },
                    { title: "Last 30 Days", value: "last30days" },
                    { title: "Custom", value: "custom" },
                  ],
                },
              ],
            },
            {
              title: "Status",
              showIcon: true,
              options: [
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
              ],
            },
            {
              title: "Category",
              showIcon: true,
              options: [
                { label: "Software", value: "software" },
                { label: "Construction", value: "construction" },
              ],
            },
          ]}
          onFilterChange={(filterTitle, value) => {
            if (filterTitle === "Date") {
              onDateFilterChange(value);
            } else if (filterTitle === "Status") {
              onStatusFilterChange(value);
            } else if (filterTitle === "Category") {
              onCategoryFilterChange(value);
            }
          }}
          selectedValues={{
            Date: dateFilter,
            Status: statusFilter,
            Category: categoryFilter,
          }}
        />
      </div>
    </div>
  );
};

export default ProjectsHeader;
