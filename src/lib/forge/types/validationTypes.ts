 
import { FieldValues, Path } from "react-hook-form";

/**
 * Field validation priority levels
 */
export type FieldPriority = 'critical' | 'important' | 'optional';

/**
 * Field validation state
 */
export type FieldValidationState<TFieldValues extends FieldValues = FieldValues> = {
  name: Path<TFieldValues>;
  isValid: boolean;
  isEmpty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  priority: FieldPriority;
  errors: string[];
  warnings: string[];
  shouldShowError?: boolean;
  validationState?: 'pending' | 'validating' | 'valid' | 'invalid';
  errorSeverity?: 'error' | 'warning' | 'info' | 'none';
  metadata?: Record<string, any>;
};

/**
 * Enhanced form validation state
 */
export type EnhancedValidationState<TFieldValues extends FieldValues = FieldValues> = {
  isValid: boolean;
  isPartiallyValid: boolean;
  criticalFieldsValid: boolean;
  importantFieldsValid: boolean;
  optionalFieldsValid: boolean;
  hasEmptyRequiredFields: boolean;
  hasUntouchedRequiredFields: boolean;
  validationProgress: number; // 0-100
  fieldStates: Record<string, FieldValidationState<TFieldValues>>;
};

/**
 * Validation context for smart validation decisions
 */
export type ValidationContext = {
  userInteractionCount: number;
  lastInteractionTime: number;
  focusedField?: string;
  submissionAttempted: boolean;
  validationMode: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
};

/**
 * Field configuration for enhanced validation
 */
export type FieldConfig<TFieldValues extends FieldValues = FieldValues> = {
  name: Path<TFieldValues>;
  priority: FieldPriority;
  required: boolean;
  validateOnEmpty: boolean;
  debounceMs?: number;
  dependencies?: Path<TFieldValues>[];
};

/**
 * Enhanced validation options
 */
export type EnhancedValidationOptions<TFieldValues extends FieldValues = FieldValues> = {
  fieldConfigs?: FieldConfig<TFieldValues>[];
  middleware?: import('../validation/validationMiddleware').ValidationMiddleware<TFieldValues>[];
  smartEmptyHandling?: boolean;
  progressiveValidation?: boolean;
  debounceValidation?: boolean;
  contextAware?: boolean;
};

/**
 * Validation strategy type
 */
export type ValidationStrategy = 'strict' | 'progressive' | 'lenient' | 'smart';

/**
 * Button state based on validation
 */
export type ButtonValidationState = {
  disabled: boolean;
  variant: 'default' | 'warning' | 'success';
  message?: string;
};