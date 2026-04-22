import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronDownIcon, AlignCenter } from "lucide-react";

type Filter = {
  title: string;
  options: {
    hasOptions?: boolean;
    value: string;
    label: string;
    subOptions?: {
      title: string;
      value: string;
    }[];
  }[];
  showIcon?: boolean;
};

type DropdownFiltersProps = {
  filters: Filter[];
  onFilterChange?: (filterTitle: string, value: string, label: string) => void;
  selectedValues?: Record<string, string>;
};

export const DropdownFilters: React.FC<DropdownFiltersProps> = ({
  filters,
  onFilterChange,
  selectedValues = {},
}) => {
  const [internalSelectedValues, setInternalSelectedValues] = useState<Record<string, string>>({});
  
  const currentSelectedValues = selectedValues || internalSelectedValues;
  
  const handleOptionChange = (filterTitle: string, value: string, label: string) => {
    if (onFilterChange) {
      onFilterChange(filterTitle, value, label);
    } else {
      setInternalSelectedValues(prev => ({
        ...prev,
        [filterTitle]: value
      }));
    }
  };
  
  const getSelectedLabel = (filter: Filter) => {
    const selectedValue = currentSelectedValues[filter.title];
    if (!selectedValue) return filter.title;
    
    // Check main options first
    for (const option of filter.options) {
      if (option.value === selectedValue) {
        return option.label;
      }
      // Check sub-options
      if (option.subOptions) {
        for (const subOption of option.subOptions) {
          if (subOption.value === selectedValue) {
            return subOption.title;
          }
        }
      }
    }
    
    return filter.title;
  };
  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case "date":
        return <CalendarIcon className="h-4 w-4 mr-4" />;
      case "status":
        return <AlignCenter className="h-4 w-4 mr-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-4">
      {filters.map((filter, index) => (
        <DropdownMenu key={index}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {filter.showIcon && getIcon(filter.title)}
              {getSelectedLabel(filter)}
              <ChevronDownIcon
                className="-me-1 opacity-60 ml-4"
                size={16}
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {filter.options.map((option, optionIndex) => {
              if (option.hasOptions && option.subOptions) {
                return (
                  <DropdownMenuSub key={optionIndex}>
                    <DropdownMenuSubTrigger inset>
                      {option.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={currentSelectedValues[filter.title] || ""}
                          onValueChange={(value) => {
                            const selectedSubOption = option.subOptions?.find(sub => sub.value === value);
                            if (selectedSubOption) {
                              handleOptionChange(filter.title, value, selectedSubOption.title);
                            }
                          }}
                        >
                          {option.subOptions.map((subOption, subIndex) => (
                            <DropdownMenuRadioItem
                              key={subIndex}
                              value={subOption.value}
                            >
                              {subOption.title}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                );
              } else {
                return (
                  <DropdownMenuItem 
                    key={optionIndex}
                    onClick={() => handleOptionChange(filter.title, option.value, option.label)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                );
              }
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
};
