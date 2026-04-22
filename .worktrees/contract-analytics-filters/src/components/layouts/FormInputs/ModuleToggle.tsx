import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReactNode } from "react";
import { ForgerSlotProps } from "@/lib/forge/types";

export type ModuleToggleProps = {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  name?: string;
  value?: boolean;
  disabled?: boolean;
  description?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
};

// Forge-compatible ModuleToggle component
export const ModuleToggle = (props: ModuleToggleProps & Partial<ForgerSlotProps>) => {
  const {
    label,
    containerClass,
    error,
    control,
    name,
    value,
    onChange,
    onBlur,
    disabled = false,
    description,
    startAdornment,
    endAdornment,
    ...switchProps
  } = props;

  return (
    <div
      className={`flex flex-col font-medium w-full relative ${
        containerClass ?? ""
      }`}
    >
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <div className="flex items-center gap-3">
          {startAdornment && (
            <span className="flex-shrink-0">{startAdornment}</span>
          )}
          <div className="flex flex-col">
            {label && (
              <Label className="text-gray-900 dark:text-gray-100 font-medium">
                {label}
              </Label>
            )}
            {description && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${
            value 
              ? "text-gray-600 dark:text-gray-400" 
              : "text-gray-500 dark:text-gray-500"
          }`}>
            {value ? "Enabled" : "Disabled"}
          </span>
          <Switch 
            {...switchProps}
            name={name}
            checked={value || false}
            onCheckedChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className="data-[state=checked]:bg-slate-700"
          />
          {endAdornment && (
            <span className="flex-shrink-0">{endAdornment}</span>
          )}
        </div>
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};