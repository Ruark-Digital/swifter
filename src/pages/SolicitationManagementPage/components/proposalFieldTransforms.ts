import type React from "react";

// Forge's web adapter calls the field onChange as `onChange(getTextTransform(value))`
// where `value` is whatever the component forwards. `TextInput` forwards the raw
// DOM change **event**, so a `transform.output` that assumes it receives the
// string value (and returns 0 for anything else) writes 0 on every keystroke —
// leaving Quantity / Unit Price stuck at 0 and impossible to type into (QA #295).
//
// Extract the value from the event (or accept a raw string/number) before
// parsing, so the field stores a real number the yup schema expects.
export const numberFieldTransform = {
  input: (value: unknown): string => {
    if (typeof value === "number") return value.toString();
    return value?.toString() ?? "";
  },
  output: (value: unknown): number => {
    const raw =
      value && typeof value === "object" && "target" in value
        ? (value as React.ChangeEvent<HTMLInputElement>).target.value
        : value;
    if (typeof raw === "number") return Number.isNaN(raw) ? 0 : raw;
    if (typeof raw !== "string") return 0;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  },
};
