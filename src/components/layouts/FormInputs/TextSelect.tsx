import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { ForgerSlotProps } from "@/lib/forge/types";

export type TextSelectProps = {
  name: string;
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  options: { label: string; value: string; disabled?: boolean }[];
  placeholder?: string;
  onChange?:
    | ((value: string) => void)
    | ((event: { target: { name: string; value: string } }) => void);
  value?: string;
  control?: any;
  "data-testid"?: string;
};

export type TextMultiSelectProps = {
  name: string;
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  options: {
    label: string;
    value: string;
    searchText?: string;
    fieldMap?: Record<string, string>;
  }[];
  placeholder?: string;
  onChange?:
    | ((value: Option[]) => void)
    | ((event: { target: { name: string; value: Option[] } }) => void);
  value?: Option[];
  control?: any;
  maxCount?: number;
  hideClearAllButton?: boolean;
  hidePlaceholderWhenSelected?: boolean;
  emptyIndicator?: React.ReactNode;
  creatable?: boolean;
  createLabel?: string;
  enableMultiTermFilter?: boolean;
  multiTermOperator?: "AND" | "OR";
  searchFieldsPriority?: string[];
};

// Forge-compatible TextSelect component
export const TextSelect = (
  props: TextSelectProps & Partial<ForgerSlotProps>,
) => {
  const {
    label,
    containerClass,
    error,
    options,
    placeholder,
    name,
    value,
    onChange,
    onBlur,
    "data-testid": dataTestId,
    ...selectProps
  } = props;

  const handleValueChange = (selectedValue: string) => {
    if (onChange) {
      // For Forge compatibility
      if (typeof onChange === "function") {
        onChange(selectedValue);
      } else {
        // For react-hook-form compatibility
        (
          onChange as (event: {
            target: { name: string; value: string };
          }) => void
        )({ target: { name: name ?? "", value: selectedValue } });
      }
    }
  };

  return (
    <div className={containerClass ?? ""}>
      {label && (
        <Label
          htmlFor={typeof label === "string" ? label : ""}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          {label}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={handleValueChange}
        name={name}
        {...selectProps}
      >
        <SelectTrigger
          data-testid={dataTestId}
          className={`w-full !h-12 border border-gray-300 rounded-lg px-4 focus:border-[#2A4467] focus:ring-[#2A4467] text-gray-900 dark:!text-gray-200 ${
            error ? "border-red-500" : ""
          }`}
          onBlur={onBlur}
        >
          <SelectValue
            placeholder={placeholder}
            className="text-gray-900 dark:!text-gray-200"
          />
        </SelectTrigger>
        <SelectContent className="max-h-60 dark:bg-gray-800 dark:border-gray-600">
          {options
            ?.filter((item) => item.value !== "")
            .map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={`py-3 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700 ${
                  item.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {item.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400 mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

// Forge-compatible TextMultiSelect component
export const TextMultiSelect = (
  props: TextMultiSelectProps & Partial<ForgerSlotProps>,
) => {
  const {
    label,
    containerClass,
    error,
    options,
    placeholder,
    name,
    value,
    onChange,
    maxCount = 3,
    hideClearAllButton = false,
    hidePlaceholderWhenSelected = false,
    emptyIndicator,
    creatable = false,
    createLabel = "Create",
    enableMultiTermFilter = false,
    multiTermOperator = "AND",
    searchFieldsPriority,
    ...selectProps
  } = props;

  const handleValueChange = (selectedOptions: Option[]) => {
    if (onChange) {
      // For Forge compatibility
      if (typeof onChange === "function") {
        onChange(selectedOptions);
      } else {
        // For react-hook-form compatibility
        (
          onChange as (event: {
            target: { name: string; value: Option[] };
          }) => void
        )({
          target: { name: name ?? "", value: selectedOptions },
        });
      }
    }
  };

  // Convert options to Option format
  const formattedOptions: Option[] = options.map((option) => ({
    label: option.label,
    value: option.value,
    searchText: option.searchText,
    fieldMap: option.fieldMap,
  }));

  return (
    <div className={containerClass ?? ""}>
      {label && (
        <Label
          htmlFor={typeof label === "string" ? label : ""}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          {label}
        </Label>
      )}

      <MultipleSelector
        value={value}
        onValueChange={handleValueChange}
        options={formattedOptions}
        placeholder={placeholder}
        maxCount={maxCount}
        hideClearAllButton={hideClearAllButton}
        hidePlaceholderWhenSelected={hidePlaceholderWhenSelected}
        emptyIndicator={
          emptyIndicator || (
            <p className="text-center text-sm">No results found</p>
          )
        }
        creatable={creatable}
        createLabel={createLabel}
        enableMultiTermFilter={enableMultiTermFilter}
        multiTermOperator={multiTermOperator}
        searchFieldsPriority={searchFieldsPriority}
        className={`w-full !h-12 border border-gray-300 rounded-lg focus:border-[#2A4467] focus:ring-[#2A4467] text-gray-900 dark:!text-gray-200 ${
          error ? "border-red-500" : ""
        }`}
        commandProps={{
          label: typeof label === "string" ? label : "Select options",
        }}
        {...selectProps}
      />
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400 mt-1">
          {error}
        </span>
      )}
    </div>
  );
};
