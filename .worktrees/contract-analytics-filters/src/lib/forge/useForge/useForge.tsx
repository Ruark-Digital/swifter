"use strict";

import { FieldValues, createFormControl, useForm } from "react-hook-form";
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
  // Create form control using createFormControl instead of useForm
  const { formControl } = createFormControl<TFieldValues>({
    defaultValues,
    resolver,
    mode,
    ...props,
  });
  
  // Use useForm with the created formControl to maintain the same interface
  const methods = useForm<TFieldValues>({ formControl });

  const hasFields =
    (typeof fields !== "undefined" && fields?.length !== 0) ?? false;

  // Initialize enhanced validation properties on the control
  const enhancedControl = {
    ...methods.control,
    hasFields,
    fields,
    _validationStrategy: validationStrategy || 'progressive',
    _fieldConfigs: fieldConfigs || [],
    _useEnhancedValidation: useEnhancedValidation || false,
    _smartEmptyHandling: smartEmptyHandling || false,
    _progressiveValidation: progressiveValidation || false,
    _debounceValidation: debounceValidation || false,
    _contextAware: contextAware || false,
  };

  return { 
    ...methods, 
    control: enhancedControl
  };
};
