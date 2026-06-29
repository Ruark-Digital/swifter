"use strict";

import { FieldValues, useForm } from "react-hook-form";
import { UseForgeProps, UseForgeResult } from "../types";

/**
 * A custom hook that returns a form component and form control functions using the `react-hook-form` library.
 * @param {ForgeFormProps} options - The options for the form.
 * @returns {UseForgeFormResult} - The form control functions and the form component.
 */
export const useForge = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldProps = unknown
>({
  defaultValues,
  resolver,
  mode,
  fields,
  validationStrategy,
  fieldConfigs,
  useEnhancedValidation,
  smartEmptyHandling,
  progressiveValidation,
  debounceValidation,
  contextAware,
  ...props
}: UseForgeProps<TFieldProps, TFieldValues>): UseForgeResult<TFieldValues> => {
  const methods = useForm<TFieldValues>({
    defaultValues,
    resolver,
    mode,
    shouldUnregister: (props as any).shouldUnregister,
    ...props,
  });

  const hasFields =
    (typeof fields !== "undefined" && fields?.length !== 0) ?? false;

  const enhancedControl = methods.control as any;
  enhancedControl.hasFields = hasFields;
  enhancedControl.fields = fields;
  enhancedControl._validationStrategy = validationStrategy || "progressive";
  enhancedControl._fieldConfigs = fieldConfigs || [];
  enhancedControl._useEnhancedValidation = useEnhancedValidation || false;
  enhancedControl._smartEmptyHandling = smartEmptyHandling || false;
  enhancedControl._progressiveValidation = progressiveValidation || false;
  enhancedControl._debounceValidation = debounceValidation || false;
  enhancedControl._contextAware = contextAware || false;

  return { 
    ...methods, 
    control: enhancedControl
  };
};
