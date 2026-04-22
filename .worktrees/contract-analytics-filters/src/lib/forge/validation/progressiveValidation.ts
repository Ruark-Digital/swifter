import { FieldValues, FieldErrors, get } from 'react-hook-form';
import {
  FieldValidationState,
  EnhancedValidationState,
  ValidationContext,
  FieldConfig,
  ButtonValidationState
} from '../types/validationTypes';
import {
  createEnhancedValidationState,
  convertErrorsToFieldStates,
  getButtonValidationState,
  isFieldEmpty
} from '../utils/validationUtils';
import {
  SmartEmptyHandler,
  createSmartEmptyHandler,
  SmartEmptyOptions
} from './smartEmptyHandling';

/**
 * Progressive validation system that validates fields based on priority
 * and user interaction patterns
 */
export class ProgressiveValidator<TFieldValues extends FieldValues = FieldValues> {
  private fieldConfigs: FieldConfig<TFieldValues>[];
  private validationContext: ValidationContext;
  private validationHistory: Map<string, { timestamp: number; wasValid: boolean }> = new Map();
  private smartEmptyHandler: SmartEmptyHandler<TFieldValues>;

  constructor(
    fieldConfigs: FieldConfig<TFieldValues>[],
    validationContext: ValidationContext,
    smartEmptyOptions?: SmartEmptyOptions
  ) {
    this.fieldConfigs = fieldConfigs;
    this.validationContext = validationContext;
    this.smartEmptyHandler = createSmartEmptyHandler<TFieldValues>(smartEmptyOptions);
  }

  /**
   * Validate fields progressively based on priority and context
   */
  async validateProgressively(
    errors: FieldErrors<TFieldValues>,
    values: TFieldValues,
    touchedFields: Record<string, boolean>,
    validatingFields: Record<string, boolean> = {}
  ): Promise<EnhancedValidationState<TFieldValues>> {
    const fieldStates = convertErrorsToFieldStates<TFieldValues>(
      errors,
      this.fieldConfigs,
      values,
      touchedFields,
      validatingFields
    );

    // Convert field states object to array for progressive logic
    const fieldStatesArray = Object.values(fieldStates);

    // Apply progressive validation logic
    const progressiveStates = this.applyProgressiveLogic(fieldStatesArray, values, touchedFields);
    
    // Apply smart empty handling
    const smartEmptyStates = this.smartEmptyHandler.applySmartEmptyHandling(
      progressiveStates,
      values,
      touchedFields,
      this.fieldConfigs,
      this.validationContext
    );
    
    // Update validation history
    this.updateValidationHistory(smartEmptyStates);

    // Convert array back to object for createEnhancedValidationState
    const smartEmptyStatesObject = smartEmptyStates.reduce((acc, state) => {
      acc[state.name as string] = state;
      return acc;
    }, {} as Record<string, FieldValidationState<TFieldValues>>);

    return createEnhancedValidationState(smartEmptyStatesObject);
  }

  /**
   * Apply progressive validation logic based on field priority and context
   */
  private applyProgressiveLogic(
    fieldStates: FieldValidationState<TFieldValues>[],
    values: TFieldValues,
    touchedFields: Record<string, boolean>
  ): FieldValidationState<TFieldValues>[] {
    return fieldStates.map(state => {
      const config = this.fieldConfigs.find(c => c.name === state.name);
      if (!config) return state;

      const fieldValue = values[state.name];
      const isTouched = get(touchedFields, state.name);
      const isEmpty = isFieldEmpty(fieldValue);
      
      // Progressive validation rules
      const progressiveState = { ...state };

      // Rule 1: Critical fields should show errors immediately if touched
      if (config.priority === 'critical' && isTouched && !state.isValid) {
        progressiveState.shouldShowError = true;
        progressiveState.errorSeverity = 'error';
      }
      
      // Rule 2: Important fields show errors after brief interaction
      else if (config.priority === 'important' && isTouched) {
        const interactionTime = this.getFieldInteractionTime(state.name as string);
        if (interactionTime > 1000) { // 1 second delay
          progressiveState.shouldShowError = !state.isValid;
          progressiveState.errorSeverity = !state.isValid ? 'warning' : 'none';
        }
      }
      
      // Rule 3: Optional fields only show errors on blur or form submission
      else if (config.priority === 'optional') {
        if (this.validationContext.submissionAttempted || 
            (isTouched && this.validationContext.validationMode === 'onBlur')) {
          progressiveState.shouldShowError = !state.isValid;
          progressiveState.errorSeverity = !state.isValid ? 'info' : 'none';
        } else {
          progressiveState.shouldShowError = false;
        }
      }

      // Rule 4: Smart empty field handling
      if (isEmpty && !isTouched) {
        progressiveState.shouldShowError = false;
        progressiveState.validationState = 'pending';
      }

      // Rule 5: Progressive disclosure - don't overwhelm with too many errors
      if (this.shouldSuppressError(state.name as string)) {
        progressiveState.shouldShowError = false;
      }

      return progressiveState;
    });
  }

  /**
   * Get the time since field was first interacted with
   */
  private getFieldInteractionTime(fieldName: string): number {
    const history = this.validationHistory.get(fieldName);
    if (!history) return 0;
    return Date.now() - history.timestamp;
  }

  /**
   * Determine if error should be suppressed to avoid overwhelming user
   */
  private shouldSuppressError(
    fieldName: string
  ): boolean {
    // Don't show more than 3 errors at once for better UX
    const currentErrorCount = Array.from(this.validationHistory.values())
      .filter(h => !h.wasValid).length;
    
    if (currentErrorCount >= 3) {
      // Only show critical errors when we have too many errors
      const config = this.fieldConfigs.find(c => c.name === fieldName);
      return config?.priority !== 'critical';
    }

    return false;
  }

  /**
   * Update validation history for progressive logic
   */
  private updateValidationHistory(fieldStates: FieldValidationState<TFieldValues>[]): void {
    fieldStates.forEach(state => {
      const fieldName = state.name as string;
      const existing = this.validationHistory.get(fieldName);
      
      if (!existing) {
        this.validationHistory.set(fieldName, {
          timestamp: Date.now(),
          wasValid: state.isValid
        });
      } else {
        // Update validity status but keep original timestamp
        existing.wasValid = state.isValid;
      }
    });
  }

  /**
   * Get button validation state based on progressive validation
   */
  getButtonValidationState(enhancedState: EnhancedValidationState<TFieldValues>): ButtonValidationState {
    return getButtonValidationState(enhancedState, this.validationContext, 'progressive');
  }

  /**
   * Reset validation history (useful for form reset)
   */
  resetValidationHistory(): void {
    this.validationHistory.clear();
    this.smartEmptyHandler.resetFieldHistory();
  }

  /**
   * Update validation context
   */
  updateContext(updates: Partial<ValidationContext>): void {
    this.validationContext = { ...this.validationContext, ...updates };
  }

  /**
   * Get validation progress (percentage of valid fields)
   */
  getValidationProgress(enhancedState: EnhancedValidationState<TFieldValues>): number {
    const totalFields = Object.keys(enhancedState.fieldStates).length;
    if (totalFields === 0) return 100;

    const validFields = Object.values(enhancedState.fieldStates).filter(state => state.isValid).length;
    return Math.round((validFields / totalFields) * 100);
  }

  /**
   * Get next field to focus based on priority and validation state
   */
  getNextFieldToFocus(enhancedState: EnhancedValidationState<TFieldValues>): string | null {
    // Find first invalid critical field
    const criticalInvalid = Object.values(enhancedState.fieldStates).find(state => 
      !state.isValid && 
      this.fieldConfigs.find(c => c.name === state.name)?.priority === 'critical'
    );
    
    if (criticalInvalid) {
      return criticalInvalid.name as string;
    }

    // Find first invalid important field
    const importantInvalid = Object.values(enhancedState.fieldStates).find(state => 
      !state.isValid && 
      this.fieldConfigs.find(c => c.name === state.name)?.priority === 'important'
    );
    
    if (importantInvalid) {
      return importantInvalid.name as string;
    }

    // Find first invalid optional field
    const optionalInvalid = Object.values(enhancedState.fieldStates).find(state => 
      !state.isValid && 
      this.fieldConfigs.find(c => c.name === state.name)?.priority === 'optional'
    );
    
    return optionalInvalid ? optionalInvalid.name as string : null;
  }
}

/**
 * Factory function to create a progressive validator
 */
export const createProgressiveValidator = <TFieldValues extends FieldValues = FieldValues>(
  fieldConfigs: FieldConfig<TFieldValues>[],
  validationContext: ValidationContext,
  smartEmptyOptions?: SmartEmptyOptions
): ProgressiveValidator<TFieldValues> => {
  return new ProgressiveValidator(fieldConfigs, validationContext, smartEmptyOptions);
};

/**
 * Hook to use progressive validation in components
 */
export const useProgressiveValidation = <TFieldValues extends FieldValues = FieldValues>(
  fieldConfigs: FieldConfig<TFieldValues>[],
  validationContext: ValidationContext,
  smartEmptyOptions?: SmartEmptyOptions
) => {
  const validator = new ProgressiveValidator(fieldConfigs, validationContext, smartEmptyOptions);
  
  return {
    validateProgressively: validator.validateProgressively.bind(validator),
    getButtonValidationState: validator.getButtonValidationState.bind(validator),
    resetValidationHistory: validator.resetValidationHistory.bind(validator),
    updateContext: validator.updateContext.bind(validator),
    getValidationProgress: validator.getValidationProgress.bind(validator),
    getNextFieldToFocus: validator.getNextFieldToFocus.bind(validator)
  };
};