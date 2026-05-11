import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ForgerSlotProps } from "@/lib/forge/types";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncate } from "lodash";

export type TextComboProps = {
  name: string;
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  onChange?: ((value: string) => void) | ((event: { target: { name: string; value: string } }) => void);
  value?: string;
  control?: any;
  emptyMessage?: string;
};

// Forge-compatible TextCombo component
export const TextCombo = (props: TextComboProps & Partial<ForgerSlotProps>) => {
  const {
    label,
    containerClass,
    error,
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    name,
    value,
    onChange,
    onBlur,
    control,
    emptyMessage = "No option found.",
    ...comboProps
  } = props;

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue;
    
    if (onChange) {
      // For Forge compatibility
      if (typeof onChange === 'function') {
        onChange(newValue);
      } else {
        // For react-hook-form compatibility
        (onChange as (event: { target: { name: string; value: string } }) => void)({
          target: { name: name ?? "", value: newValue }
        });
      }
    }
    setOpen(false);
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`flex flex-col font-medium w-full relative ${
      containerClass ?? ""
    }`}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-12 justify-between border border-gray-300 rounded-lg px-4 hover:bg-transparent focus:border-[#2A4467] focus:ring-[#2A4467] text-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-transparent truncate",
              error ? "border-red-500" : "",
              !selectedOption && "text-gray-500 dark:text-gray-400"
            )}
            onBlur={onBlur}
            {...comboProps}
          >
            {selectedOption ? truncate(selectedOption.label, { length: 60 }) : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-gray-900 dark:border-gray-600 bg-white ">
          <div className="p-2" onClick={() => inputRef.current?.focus()}>
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div className="max-h-60 overflow-auto bg-white dark:bg-slate-950">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200",
                    value === option.value && "bg-gray-100 dark:bg-gray-700"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400 mt-1">
          {error}
        </span>
      )}
    </div>
  );
};