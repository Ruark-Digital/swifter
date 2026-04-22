 
import { FieldValues, Path, FieldErrors, get } from "react-hook-form";
import {
  FieldPriority,
  FieldValidationState,
  EnhancedValidationState,
  ValidationContext,
  FieldConfig,
  ValidationStrategy,
  ButtonValidationState
} from "../types/validationTypes";

/**
 * Default field priority based on field name patterns
 */
export const getDefaultFieldPriority = (fieldName: string): FieldPriority => {
  const criticalPatterns = [
    /email/i,
    /password/i,
    /username/i,
    /phone/i,
    /required/i,
    /mandatory/i
  ];
  
  const importantPatterns = [
    /name/i,
    /address/i,
    /date/i,
    /amount/i,
    /price/i,
    /quantity/i
  ];
  
  if (criticalPatterns.some(pattern => pattern.test(fieldName))) {
    return 'critical';
  }
  
  if (importantPatterns.some(pattern => pattern.test(fieldName))) {
    return 'important';
  }
  
  return 'optional';
};

/**
 * Create field configuration with defaults
 */
export const createFieldConfig = <TFieldValues extends FieldValues = FieldValues>(
  name: Path<TFieldValues>,
  overrides: Partial<FieldConfig<TFieldValues>> = {}
): FieldConfig<TFieldValues> => {
  return {
    name,
    priority: getDefaultFieldPriority(name),
    required: false,
    validateOnEmpty: false,
    debounceMs: 300,
    dependencies: [],
    ...overrides
  };
};

/**
 * Check if a field value is considered empty
 */
export const isFieldEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Calculate validation progress based on field states
 */
export const calculateValidationProgress = <TFieldValues extends FieldValues = FieldValues>(
  fieldStates: Record<string, FieldValidationState<TFieldValues>>
): number => {
  const fields = Object.values(fieldStates);
  if (fields.length === 0) return 100;
  
  const weights = {
    critical: 3,
    important: 2,
    optional: 1
  };
  
  let totalWeight = 0;
  let validWeight = 0;
  
  fields.forEach(field => {
    const weight = weights[field.priority];
    totalWeight += weight;
    if (field.isValid) {
      validWeight += weight;
    }
  });
  
  return totalWeight > 0 ? Math.round((validWeight / totalWeight) * 100) : 100;
};

/**
 * Create enhanced validation state from field states
 */
export const createEnhancedValidationState = <TFieldValues extends FieldValues = FieldValues>(
  fieldStates: Record<string, FieldValidationState<TFieldValues>>
): EnhancedValidationState<TFieldValues> => {
  const fields = Object.values(fieldStates);
  
  const criticalFields = fields.filter(f => f.priority === 'critical');
  const importantFields = fields.filter(f => f.priority === 'important');
  const optionalFields = fields.filter(f => f.priority === 'optional');
  
  const criticalFieldsValid = criticalFields.length === 0 || criticalFields.every(f => f.isValid);
  const importantFieldsValid = importantFields.length === 0 || importantFields.every(f => f.isValid);
  const optionalFieldsValid = optionalFields.length === 0 || optionalFields.every(f => f.isValid);
  
  const isValid = criticalFieldsValid && importantFieldsValid && optionalFieldsValid;
  const isPartiallyValid = criticalFieldsValid && importantFieldsValid;
  
  const hasEmptyRequiredFields = fields.some(f => f.isEmpty && f.priority !== 'optional');
  const hasUntouchedRequiredFields = fields.some(f => !f.isTouched && f.priority !== 'optional');
  
  return {
    isValid,
    isPartiallyValid,
    criticalFieldsValid,
    importantFieldsValid,
    optionalFieldsValid,
    hasEmptyRequiredFields,
    hasUntouchedRequiredFields,
    validationProgress: calculateValidationProgress(fieldStates),
    fieldStates
  };
};

/**
 * Determine button state based on validation and strategy
 */
export const getButtonValidationState = <TFieldValues extends FieldValues = FieldValues>(
  validationState: EnhancedValidationState<TFieldValues>,
  context: ValidationContext,
  strategy: ValidationStrategy = 'progressive'
): ButtonValidationState => {
  // Guard against undefined context
  if (!context) {
    return {
      disabled: !validationState.isValid,
      variant: 'default',
      message: undefined
    };
  }
  const { isValid, isPartiallyValid, criticalFieldsValid, hasUntouchedRequiredFields } = validationState;
  
  switch (strategy) {
    case 'strict':
      return {
        disabled: !isValid,
        variant: isValid ? 'success' : 'default',
        message: isValid ? undefined : 'Please complete all required fields'
      };
      
    case 'progressive':
      if (!context.submissionAttempted && hasUntouchedRequiredFields) {
        return {
          disabled: false,
          variant: 'default',
          message: undefined
        };
      }
      
      if (criticalFieldsValid && isPartiallyValid) {
        return {
          disabled: false,
          variant: isValid ? 'success' : 'warning',
          message: isValid ? undefined : 'Some optional fields need attention'
        };
      }
      
      return {
        disabled: !criticalFieldsValid,
        variant: 'default',
        message: 'Please complete critical fields'
      };
      
    case 'lenient':
      return {
        disabled: !criticalFieldsValid,
        variant: isValid ? 'success' : (isPartiallyValid ? 'warning' : 'default'),
        message: undefined
      };
      
    case 'smart':
      const interactionThreshold = 3;
      const timeThreshold = 5000; // 5 seconds
      
      if (context.userInteractionCount < interactionThreshold && 
          Date.now() - context.lastInteractionTime < timeThreshold) {
        return {
          disabled: false,
          variant: 'default',
          message: undefined
        };
      }
      
      return getButtonValidationState(validationState, context, 'progressive');
      
    default:
      return {
        disabled: !isValid,
        variant: 'default',
        message: undefined
      };
  }
};

/**
 * Create validation context
 */
export const createValidationContext = (
  overrides: Partial<ValidationContext> = {}
): ValidationContext => {
  return {
    userInteractionCount: 0,
    lastInteractionTime: Date.now(),
    submissionAttempted: false,
    validationMode: 'onChange',
    ...overrides
  };
};

/**
 * Update validation context on user interaction
 */
export const updateValidationContext = (
  context: ValidationContext,
  updates: Partial<ValidationContext>
): ValidationContext => {
  return {
    ...context,
    ...updates,
    userInteractionCount: updates.focusedField ? context.userInteractionCount + 1 : context.userInteractionCount,
    lastInteractionTime: Date.now()
  };
};

/**
 * Debounce function for validation
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Safely extract string error messages from react-hook-form error objects
 */
const extractErrorMessages = (err: unknown): string[] => {
  if (!err) return [];
  const e: any = err;

  // Handle multiple error messages (e.types)
  if (e?.types && typeof e.types === 'object') {
    try {
      return Object.values(e.types).map((m: any) => String(m));
    } catch {
      return ['Invalid field'];
    }
  }

  if (typeof e?.message !== 'undefined') {
    return [String(e.message)];
  }

  if (typeof e === 'string') {
    return [e];
  }

  return ['Invalid field'];
};

/**
 * Convert react-hook-form errors to field validation states
 */
export const convertErrorsToFieldStates = <TFieldValues extends FieldValues = FieldValues>(
  errors: FieldErrors<TFieldValues>,
  fieldConfigs: FieldConfig<TFieldValues>[],
  formValues: TFieldValues,
  touchedFields: Record<string, boolean> = {},
  validatingFields: Record<string, boolean> = {}
): Record<string, FieldValidationState<TFieldValues>> => {
  const fieldStates: Record<string, FieldValidationState<TFieldValues>> = {};
  
  fieldConfigs.forEach(config => {
    const fieldName = config.name as string;
    const fieldError = errors[config.name];
    const fieldValue = formValues[config.name];
    
    fieldStates[fieldName] = {
      name: config.name,
      isValid: !fieldError,
      isEmpty: isFieldEmpty(fieldValue),
      isTouched: get(touchedFields, fieldName) || false,
      isValidating: get(validatingFields, fieldName) || false,
      priority: config.priority,
      errors: extractErrorMessages(fieldError as unknown),
      warnings: []
    };
  });
  
  return fieldStates;
};