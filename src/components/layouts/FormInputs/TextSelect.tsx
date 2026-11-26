import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { ForgerSlotProps } from "@adexdsamson/forge";

// Sentinel value for the opt-in "Clear selection" row. Radix Select can't
// toggle a selected item off or use an empty-value item, so a deselectable
// select emits this sentinel and we map it back to "" before calling onChange.
const CLEAR_SELECTION_VALUE = "__clear_selection__";

export type TextSelectProps = {
  name: string;
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  options: { label: string; value: string; disabled?: boolean }[];
  placeholder?: string;
  /** When true, a "Clear selection" row lets the user reset the field to empty
   *  (only shown while a value is selected). Off by default so required
   *  single-selects stay non-clearable. */
  deselectable?: boolean;
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
    deselectable,
    onChange,
    onBlur,
    "data-testid": dataTestId,
    ...selectProps
  } = props;

  // Options may share a stored value (timezones.json: CST is both
  // America/Chicago and Asia/Shanghai, AST both America/Halifax and
  // Asia/Riyadh). Radix keys its items and hidden native <option>s by value,
  // so repeated values get a unique select value here; onChange still emits
  // the stored value, and a stored value pre-selects its first option
  // (S1-FE-18).
  const selectOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of options ?? []) counts.set(o.value, (counts.get(o.value) ?? 0) + 1);
    return (options ?? []).map((o) => ({
      ...o,
      selectValue: (counts.get(o.value) ?? 0) > 1 ? `${o.value}|${o.label}` : o.value,
    }));
  }, [options]);
  // Which of several same-valued options the user picked, so it stays shown.
  const [picked, setPicked] = useState<string | undefined>();
  const toSelectValue = (stored?: string) => {
    if (stored === undefined || stored === "") return stored;
    const matches = selectOptions.filter((o) => o.value === stored);
    if (matches.length < 2) return stored;
    return matches.find((o) => o.selectValue === picked)?.selectValue ?? matches[0].selectValue;
  };

  const handleValueChange = (selectedValue: string) => {
    // The "Clear selection" row reports the sentinel; emit "" instead.
    const option = selectOptions.find((o) => o.selectValue === selectedValue);
    setPicked(option ? selectedValue : undefined);
    const nextValue =
      selectedValue === CLEAR_SELECTION_VALUE ? "" : option?.value ?? selectedValue;
    // Callers (Forge slots, and RHF's field.onChange) accept the raw value.
    // The former event-style branch was unreachable — both members of the
    // onChange union are functions, so a runtime `typeof` check could never
    // select it — so call the value-style signature directly.
    (onChange as ((value: string) => void) | undefined)?.(nextValue);
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
        value={toSelectValue(value)}
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
          {deselectable && value ? (
            <SelectItem
              value={CLEAR_SELECTION_VALUE}
              className="py-3 text-gray-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
            >
              Clear selection
            </SelectItem>
          ) : null}
          {selectOptions
            .filter((item) => item.value !== "")
            .map((item) => (
              <SelectItem
                key={item.selectValue}
                value={item.selectValue}
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
