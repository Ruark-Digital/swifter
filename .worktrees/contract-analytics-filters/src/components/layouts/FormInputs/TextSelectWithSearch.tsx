"use client"

import { useId, useState } from "react"
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ForgerSlotProps } from "@/lib/forge/types"

export type TextSelectWithSearchProps = {
  name: string;
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onChange?: ((value: string) => void) | ((event: { target: { name: string; value: string } }) => void);
  value?: string;
  control?: any;
  onCreateNew?: () => void;
  createNewLabel?: string;
  showCreateNew?: boolean;
};

// Forge-compatible TextSelectWithSearch component
export const TextSelectWithSearch = (props: TextSelectWithSearchProps & Partial<ForgerSlotProps>) => {
  const {
    label,
    containerClass,
    error,
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    name,
    value,
    onChange,
    onBlur,
    control,
    onCreateNew,
    createNewLabel = "Create new",
    showCreateNew = false,
    ...commandProps
  } = props;

  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

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

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
      setOpen(false);
    }
  };

  const selectedOption = options.find((option) => option.value === value);
  

  return (
    <div className={`flex flex-col font-medium w-full relative ${
      containerClass ?? ""
    }`}>
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "bg-background hover:bg-background border-input w-full h-12 justify-between px-4 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] focus:border-[#2A4467] focus:ring-[#2A4467] text-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-transparent",
              error ? "border-red-500" : "",
              !selectedOption && "text-gray-500 dark:text-gray-400"
            )}
            onBlur={onBlur}
            {...commandProps}
          >
            <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0 dark:bg-gray-800 dark:border-gray-700"
          align="start"
        >
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder} 
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className="dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                  >
                    {option.label}
                    {value === option.value && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>

              {showCreateNew && (
                <>
                  <CommandSeparator />
                  <CommandGroup >
                    <Button
                      variant="ghost"
                      className="w-full font-normal dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={handleCreateNew}
                    >
                      <PlusIcon
                        size={16}
                        className="mr-2 opacity-60"
                        aria-hidden="true"
                      />
                      {createNewLabel}
                    </Button>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
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