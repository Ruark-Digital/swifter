/* eslint-disable react-hooks/exhaustive-deps */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ReactNode,
  useState,
  useId,
  useEffect,
  InputHTMLAttributes,
} from "react";
import { ForgerSlotProps } from "@/lib/forge/types";
import { Tag, TagInput } from "emblor";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn, formatDateTZ } from "@/lib/utils";
import CurrencyInput from "react-currency-input-field";

export type CustomTag = Tag & {
  meta: Record<string, any>;
};

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  name?: string;
  helperText?: string;
};

export type TextAreaProps = React.InputHTMLAttributes<HTMLTextAreaElement> & {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  rows?: number;
  name?: string;
  helperText?: string;
};

export type TextTagInputProps = {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  name?: string;
  value?: CustomTag[];
  tags?: CustomTag[];
  ref?: React.Ref<HTMLInputElement>;
  helperText?: string;
  placeholder?: string;
  inlineTagsContainerClassName?: string;
  enableDetailsPopover?: boolean;
  enableAutocomplete?: boolean;
  autocompleteOptions?: CustomTag[];
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  inputClassName?: string;
  tagClassName?: string;
  closeButtonClassName?: string;
  restrictTagsToAutocompleteOptions?: boolean;
};

export type TextDatePickerProps = {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  name?: string;
  value?: Date;
  placeholder?: string;
  minDate?: Date;
  showTime?: boolean;
  maxDate?: Date;
  helperText?: string;
  disabled?: boolean;
};

export type TextTimeInputProps = {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  helperText?: string;
};

// Forge-compatible TextInput component
export const TextInput = (props: TextInputProps & Partial<ForgerSlotProps>) => {
  const {
    label,
    containerClass,
    error,
    startAdornment,
    endAdornment,
    name,
    value,
    onChange,
    onBlur,
    helperText,
    ...inputProps
  } = props;

  return (
    <div
      className={`flex flex-col font-medium w-full relative ${
        containerClass ?? ""
      }`}
    >
      {label && (
        <Label className="text-sm font-medium text-gray-700  mb-2">
          {label}
        </Label>
      )}
      <div className="relative">
        {startAdornment && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            {startAdornment}
          </span>
        )}
        <Input
          {...inputProps}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-[#2A4467] focus:ring-[#2A4467] ${
            startAdornment ? "pl-10" : ""
          } ${endAdornment ? "pr-10" : ""} ${error ? "border-red-500" : ""}`}
        />
        {endAdornment && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            {endAdornment}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

// Forge-compatible TextArea component
export const TextArea = (props: TextAreaProps & Partial<ForgerSlotProps>) => {
  const {
    label,
    containerClass,
    error,
    startAdornment,
    endAdornment,
    name,
    value,
    onChange,
    onBlur,
    rows = 4,
    helperText,
    ...textareaProps
  } = props;

  return (
    <div
      className={`flex flex-col font-medium w-full relative ${
        containerClass ?? ""
      }`}
    >
      {label && (
        <Label className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Label>
      )}
      <div className="relative">
        {startAdornment && (
          <span className="absolute left-3 top-3 z-10">{startAdornment}</span>
        )}
        <Textarea
          {...textareaProps}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          className={`w-full min-h-[120px] border border-gray-300 rounded-lg px-4 py-3 resize-none focus:border-[#2A4467] focus:ring-[#2A4467] dark:text-gray-200 ${
            startAdornment ? "pl-10" : ""
          } ${endAdornment ? "pr-10" : ""} ${error ? "border-red-500" : ""}`}
        />
        {endAdornment && (
          <span className="absolute right-3 top-3 z-10">{endAdornment}</span>
        )}
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

export const TextTagInput = (
  props: TextTagInputProps & Partial<Omit<ForgerSlotProps, "value">>,
) => {
  const {
    label,
    containerClass,
    error,
    name,
    value = [],
    onChange,
    tags,
    ref,
    helperText,
    placeholder,
    inlineTagsContainerClassName,
    enableDetailsPopover,
    enableAutocomplete,
    autocompleteOptions,
    inputProps,
    restrictTagsToAutocompleteOptions,
    inputClassName,
    tagClassName,
    closeButtonClassName,
  } = props;
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const safeValue = Array.isArray(value) ? value : [];
  const safeTags = Array.isArray(tags) ? tags : safeValue;
  const safeAutocompleteOptions = Array.isArray(autocompleteOptions)
    ? autocompleteOptions
    : [];
  const shouldEnableAutocomplete =
    Boolean(enableAutocomplete) && safeAutocompleteOptions.length > 0;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
  });
  const [errorText, setErrorText] = useState<string | null>(null);
  const isEditing = activeTagIndex !== null;

  const prefillFromIndex = (idx: number) => {
    const tagsArr = value ?? [];
    const currentTag = tagsArr[idx];

    if (!currentTag) return;

    setFormData({
      name: currentTag?.text ?? "",
      email: currentTag?.id ?? "",
      role: currentTag?.meta?.role ?? "",
      phone: currentTag?.meta?.phone ?? "",
    });
    setErrorText(null);
  };

  useEffect(() => {
    if (activeTagIndex !== null) {
      prefillFromIndex(activeTagIndex);
      if (enableDetailsPopover) setOpen(true);
    }
  }, [activeTagIndex]);

  const handleTagSubInputChange = () => {
    const nameVal = formData.name.trim();
    const emailVal = formData.email.trim();
    const roleVal = formData.role.trim();
    const phoneVal = formData.phone.trim();

    if (!nameVal || !emailVal) {
      setErrorText("Name and Email are required");
      return;
    }

    const exists = (value ?? []).some((t, idx) => {
      if (activeTagIndex !== null && idx === activeTagIndex) return false;
      return (
        t.text?.toLowerCase() === nameVal.toLowerCase() ||
        t.id?.toLowerCase() === emailVal.toLowerCase()
      );
    });

    if (exists) {
      setErrorText("Duplicate entry");
      return;
    }

    const newTag: CustomTag = {
      id: emailVal,
      text: nameVal,
      meta: {
        role: roleVal || undefined,
        phone: phoneVal || undefined,
      },
    };

    let newTags = [...(value ?? [])];

    if (activeTagIndex !== null) {
      newTags[activeTagIndex] = newTag;
    } else {
      newTags = [...newTags, newTag];
    }

    onChange?.(newTags);

    setErrorText(null);
    setOpen(false);
    setActiveTagIndex(null);
    setFormData({
      name: "",
      email: "",
      role: "",
      phone: "",
    });
  };

  return (
    <div
      className={`flex flex-col font-medium w-full relative ${
        containerClass ?? ""
      }`}
    >
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </Label>
      )}

      {enableDetailsPopover ? (
        <Popover modal open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div
              onClick={() => {
                if (activeTagIndex !== null) {
                  prefillFromIndex(activeTagIndex);
                } else {
                  setActiveTagIndex(null);
                  setFormData({
                    name: "",
                    email: "",
                    role: "",
                    phone: "",
                  });
                }
                setOpen(true);
              }}
              className="cursor-pointer"
            >
              <TagInput
                name={name}
                value={safeValue}
                ref={ref}
                tags={safeTags}
                enableAutocomplete={shouldEnableAutocomplete}
                autocompleteOptions={safeAutocompleteOptions}
                restrictTagsToAutocompleteOptions={
                  restrictTagsToAutocompleteOptions
                }
                setTags={(newTags) => {
                  onChange?.(newTags);
                }}
                placeholder={placeholder ?? "Add a tag"}
                inputProps={inputProps}
                styleClasses={{
                  inlineTagsContainer: cn(
                    "border-input rounded-lg bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1 dark:border-slate-800 dark:bg-slate-950",
                    inlineTagsContainerClassName,
                  ),
                  input: cn(
                    "w-full min-w-[80px] shadow-none px-2 h-10 dark:text-slate-50 dark:placeholder:text-slate-400",
                    inputClassName,
                  ),
                  tag: {
                    body: cn(
                      "h-7 relative bg-background border border-input hover:bg-background !rounded-lg font-medium text-xs ps-3 pe-7 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-50",
                      tagClassName,
                    ),
                    closeButton: cn(
                      "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-50 dark:focus-visible:border-slate-300 dark:focus-visible:ring-slate-300/50",
                      closeButtonClassName,
                    ),
                  },
                }}
                activeTagIndex={activeTagIndex}
                setActiveTagIndex={setActiveTagIndex}
                onTagClick={(clicked) => {
                  const list = value ?? [];
                  const idx = list.findIndex(
                    (t) =>
                      (t.id ?? "").toLowerCase() ===
                        (clicked.id ?? "").toLowerCase() &&
                      (t.text ?? "").toLowerCase() ===
                        (clicked.text ?? "").toLowerCase(),
                  );

                  if (idx >= 0) {
                    // setActiveTagIndex(idx);
                    prefillFromIndex(idx);
                    setOpen(true);
                  }
                }}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="z-[60] w-[360px] lg:w-[420px] p-4 bg-white border shadow-xl"
            align="start"
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Add Key Personnel Details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter Name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter Email"
                    type="email"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Input
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="Enter Role"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter Phone Number"
                  />
                </div>
              </div>

              {errorText && (
                <span className="text-xs text-red-500">{errorText}</span>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setActiveTagIndex(null);
                  }}
                >
                  Cancel
                </Button>

                <Button onClick={() => handleTagSubInputChange()}>
                  {isEditing ? "Save" : "Add"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <TagInput
          name={name}
          value={safeValue}
          ref={ref}
          tags={safeTags ?? safeValue}
          enableAutocomplete={enableAutocomplete}
          // className="bg-purple-600"
          autocompleteOptions={autocompleteOptions}
          restrictTagsToAutocompleteOptions={restrictTagsToAutocompleteOptions}
          setTags={(newTags) => {
            onChange?.(newTags);
          }}
          placeholder={placeholder ?? "Add a tag"}
          inputProps={inputProps}
          styleClasses={{
            inlineTagsContainer: cn(
              "border-input rounded-lg bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1 dark:border-slate-800 dark:bg-slate-950",
              inlineTagsContainerClassName,
            ),

            input: cn(
              "w-full min-w-[80px] shadow-none px-2 h-10 dark:text-slate-50 dark:placeholder:text-slate-400",
              inputClassName,
            ),

            autoComplete: {
              popoverContent: "bg-white"
            },

            tag: {
              body: cn(
                "h-7 relative bg-background border border-input hover:bg-background !rounded-lg font-medium text-xs ps-3 pe-7 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-50",
                tagClassName,
              ),
              closeButton: cn(
                "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-50 dark:focus-visible:border-slate-300 dark:focus-visible:ring-slate-300/50",
                closeButtonClassName,
              ),
            },
          }}
          activeTagIndex={activeTagIndex}
          setActiveTagIndex={setActiveTagIndex}
        />
      )}

      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}

      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

// Forge-compatible TextDatePicker component
export const TextDatePicker = (
  props: TextDatePickerProps & Partial<ForgerSlotProps>,
) => {
  const {
    label,
    containerClass,
    error,
    value,
    placeholder = "Pick a date",
    onChange,
    minDate,
    maxDate,
    showTime,
    helperText,
    disabled
  } = props;
  const id = useId();
  const [timeValue, setTimeValue] = useState<string>("");

  useEffect(() => {
    if (value) {
      const val =
        typeof value === "string"
          ? value?.includes("T")
            ? value?.split("T")?.[1]?.split?.(".")?.[0]
            : ""
          : format(value, "HH:mm");

      setTimeValue(val);
    } else {
      setTimeValue("");
    }
  }, [value]);

  const combineDateTime = (date: Date | undefined, time: string) => {
    if (!date) return undefined;

    const [hours, minutes] = time.split(":").map(Number);

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      isNaN(hours) ? 0 : hours,
      isNaN(minutes) ? 0 : minutes,
      0,
      0,
    );
  };

  return (
    <div
      className={`flex flex-col font-medium w-full relative ${
        containerClass ?? ""
      }`}
    >
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </Label>
      )}
      <Popover modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={"outline"}
            className={`group bg-background hover:bg-background border-gray-300 w-full h-12 justify-between px-4 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] focus:border-[#2A4467] focus:ring-[#2A4467] rounded-lg ${
              error ? "border-red-500" : ""
            }`}
            disabled={disabled}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value
                ? formatDateTZ(value, showTime ? "MMM d, yyyy hh:mm a" : "PPP")
                : placeholder}
            </span>
            <CalendarIcon
              size={16}
              className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 " align="start">
          <Calendar
            mode="single"
            selected={value}
            className={showTime ? "rounded-b-none" : ""}
            onSelect={(date) => {
              if (showTime) {
                const combined = combineDateTime(date, timeValue);
                onChange?.(combined);
              } else {
                onChange?.(date);
              }
            }}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
          {showTime && (
            <TextTimeInput
              containerClass="rounded-t-none"
              className="!rounded-t-none"
              value={timeValue}
              onChange={(e) => {
                const newTime = e.target.value;
                setTimeValue(newTime);
                const combined = combineDateTime(value, newTime);
                onChange?.(combined);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

// Forge-compatible TextTimeInput component
export const TextTimeInput = (
  props: TextTimeInputProps & Partial<ForgerSlotProps>,
) => {
  const {
    label,
    containerClass,
    error,
    value,
    placeholder = "Select time",
    onChange,
    onBlur,
    name,
    className,
    helperText,
    ...inputProps
  } = props;
  const id = useId();

  return (
    <div
      className={`flex flex-col font-medium w-full relative bg-pink-600 ${
        containerClass ?? ""
      }`}
    >
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </Label>
      )}
      <div className="relative w-full">
        <Input
          {...inputProps}
          id={id}
          type="time"
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full h-12 border border-gray-300 rounded-lg px-4 pr-10 focus:border-[#2A4467] focus:ring-[#2A4467] ${
            error ? "border-red-500" : ""
          } ${className}`}
        />
        {/* <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 z-10 flex items-center justify-center pe-3">
          <ClockIcon size={16} aria-hidden="true" />
        </div> */}
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

type TextCurrencyInputProps = Omit<TextInputProps, "onChange"> & {
  onChange: (value: number | string) => void;
};

export const TextCurrencyInput = (props: TextCurrencyInputProps) => {
  const {
    label,
    containerClass,
    error,
    startAdornment,
    endAdornment,
    name,
    value,
    onChange,
    onBlur,
    helperText,
    placeholder,
    className,
    id,
  } = props;

  return (
    <div
      className={`flex flex-col font-medium w-full relative ${
        containerClass ?? ""
      }`}
    >
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </Label>
      )}
      <div className="relative">
        {startAdornment && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            {startAdornment}
          </span>
        )}
        <CurrencyInput
          // {...inputProps}
          id={id}
          name={name}
          value={value}
          onBlur={onBlur}
          decimalsLimit={2}
          prefix="$"
          defaultValue={1000}
          onValueChange={(value) => onChange?.(value ?? "")}
          placeholder={placeholder}
          className={`w-full h-12 border border-gray-300 rounded-lg px-4 pr-10 focus:border-[#2A4467] focus:ring-[#2A4467] ${
            error ? "border-red-500" : ""
          } ${className}`}
        />
        {endAdornment && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            {endAdornment}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};
