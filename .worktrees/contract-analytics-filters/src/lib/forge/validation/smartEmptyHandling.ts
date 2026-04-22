import { FieldValues, Path, get } from 'react-hook-form';
import {
  FieldValidationState,
  ValidationContext,
  FieldConfig,
  FieldPriority
} from '../types/validationTypes';
import { isFieldEmpty } from '../utils/validationUtils';

/**
 * Smart empty field handling that distinguishes between different types of empty states
 */
export interface EmptyFieldState {
  isEmpty: boolean;
  isUntouched: boolean;
  isRequired: boolean;
  shouldShowError: boolean;
  emptyType: 'untouched' | 'cleared' | 'invalid-empty' | 'valid-empty';
  priority: FieldPriority;
}

/**
 * Configuration for smart empty handling
 */
export interface SmartEmptyOptions {
  /** Show errors for required empty fields immediately */
  immediateRequiredValidation?: boolean;
  /** Delay before showing errors for cleared fields (ms) */
  clearedFieldDelay?: number;
  /** Grace period for required fields (ms) */
  requiredFieldGracePeriod?: number;
  /** Different handling based on field priority */
  priorityBasedHandling?: boolean;
}

/**
 * Smart empty field handler class
 */
export class SmartEmptyHandler<TFieldValues extends FieldValues = FieldValues> {
  private fieldInteractionHistory: Map<string, {
    firstTouched: number;
    lastCleared: number;
    wasNonEmpty: boolean;
    clearCount: number;
  }> = new Map();

  private options: Required<SmartEmptyOptions>;

  constructor(options: SmartEmptyOptions = {}) {
    this.options = {
      immediateRequiredValidation: false,
      clearedFieldDelay: 1500,
      requiredFieldGracePeriod: 2000,
      priorityBasedHandling: true,
      ...options
    };
  }

  /**
   * Analyze empty field state and determine how to handle it
   */
  analyzeEmptyField<T extends Path<TFieldValues>>(
    fieldName: T,
    fieldValue: any,
    isTouched: boolean,
    fieldConfig: FieldConfig<TFieldValues>,
    validationContext: ValidationContext
  ): EmptyFieldState {
    const isEmpty = isFieldEmpty(fieldValue);
    const isRequired = fieldConfig.required || false;
    const priority = fieldConfig.priority;
    
    if (!isEmpty) {
      // Field is not empty, update history and return
      this.updateFieldHistory(fieldName as string, false);
      return {
        isEmpty: false,
        isUntouched: false,
        isRequired,
        shouldShowError: false,
        emptyType: 'valid-empty',
        priority
      };
    }

    const history = this.fieldInteractionHistory.get(fieldName as string);
    const now = Date.now();

    // Determine empty type
    let emptyType: EmptyFieldState['emptyType'] = 'untouched';
    let shouldShowError = false;

    if (!isTouched && !history) {
      // Completely untouched field
      emptyType = 'untouched';
      shouldShowError = false;
    } else if (history?.wasNonEmpty && isEmpty) {
      // Field was non-empty but is now empty (cleared)
      emptyType = 'cleared';
      const timeSinceCleared = now - (history.lastCleared || now);
      
      if (this.options.priorityBasedHandling) {
        shouldShowError = this.shouldShowErrorForClearedField(
          priority,
          timeSinceCleared,
          isRequired,
          validationContext
        );
      } else {
        shouldShowError = timeSinceCleared > this.options.clearedFieldDelay;
      }
    } else if (isTouched && isEmpty && isRequired) {
      // Touched empty required field
      emptyType = 'invalid-empty';
      const timeSinceTouched = history ? now - history.firstTouched : 0;
      
      if (this.options.immediateRequiredValidation) {
        shouldShowError = true;
      } else {
        shouldShowError = this.shouldShowErrorForRequiredField(
          priority,
          timeSinceTouched,
          validationContext
        );
      }
    } else if (isTouched && isEmpty && !isRequired) {
      // Touched empty optional field
      emptyType = 'valid-empty';
      shouldShowError = false;
    }

    // Update history
    this.updateFieldHistory(fieldName as string, true);

    return {
      isEmpty: true,
      isUntouched: !isTouched && !history,
      isRequired,
      shouldShowError,
      emptyType,
      priority
    };
  }

  /**
   * Determine if error should be shown for a cleared field
   */
  private shouldShowErrorForClearedField(
    priority: FieldPriority,
    timeSinceCleared: number,
    isRequired: boolean,
    validationContext: ValidationContext
  ): boolean {
    // Always show errors on form submission attempt
    if (validationContext.submissionAttempted) {
      return isRequired;
    }

    // Priority-based delays
    const delays = {
      critical: 500,   // Show errors quickly for critical fields
      important: 1000, // Medium delay for important fields
      optional: 2000   // Longer delay for optional fields
    };

    const delay = delays[priority] || this.options.clearedFieldDelay;
    return timeSinceCleared > delay && isRequired;
  }

  /**
   * Determine if error should be shown for a required field
   */
  private shouldShowErrorForRequiredField(
    priority: FieldPriority,
    timeSinceTouched: number,
    validationContext: ValidationContext
  ): boolean {
    // Always show errors on form submission attempt
    if (validationContext.submissionAttempted) {
      return true;
    }

    // Priority-based grace periods
    const gracePeriods = {
      critical: 1000,  // Short grace period for critical fields
      important: 1500, // Medium grace period for important fields
      optional: 3000   // Longer grace period for optional fields
    };

    const gracePeriod = gracePeriods[priority] || this.options.requiredFieldGracePeriod;
    return timeSinceTouched > gracePeriod;
  }

  /**
   * Update field interaction history
   */
  private updateFieldHistory(
    fieldName: string,
    isEmpty: boolean
  ): void {
    const now = Date.now();
    const existing = this.fieldInteractionHistory.get(fieldName);
    
    if (!existing) {
      this.fieldInteractionHistory.set(fieldName, {
        firstTouched: now,
        lastCleared: isEmpty ? now : 0,
        wasNonEmpty: !isEmpty,
        clearCount: isEmpty ? 1 : 0
      });
    } else {
      const wasEmpty = !existing.wasNonEmpty;
      const becameEmpty = !wasEmpty && isEmpty;
      
      this.fieldInteractionHistory.set(fieldName, {
        ...existing,
        lastCleared: becameEmpty ? now : existing.lastCleared,
        wasNonEmpty: existing.wasNonEmpty || !isEmpty,
        clearCount: becameEmpty ? existing.clearCount + 1 : existing.clearCount
      });
    }
  }

  /**
   * Apply smart empty handling to field validation states
   */
  applySmartEmptyHandling(
    fieldStates: FieldValidationState<TFieldValues>[],
    values: TFieldValues,
    touchedFields: Record<string, boolean>,
    fieldConfigs: FieldConfig<TFieldValues>[],
    validationContext: ValidationContext
  ): FieldValidationState<TFieldValues>[] {
    return fieldStates.map(state => {
      const fieldConfig = fieldConfigs.find(config => config.name === state.name);
      if (!fieldConfig) return state;

      const fieldValue = values[state.name];
      const isTouched = get(touchedFields, state.name) || false;
      
      const emptyState = this.analyzeEmptyField(
        state.name,
        fieldValue,
        isTouched,
        fieldConfig,
        validationContext
      );

      // Apply smart empty handling logic
      const enhancedState = { ...state };

      if (emptyState.isEmpty) {
        // Override error display based on smart empty analysis
        enhancedState.shouldShowError = emptyState.shouldShowError;
        
        // Set appropriate validation state
        if (emptyState.emptyType === 'untouched') {
          enhancedState.validationState = 'pending';
        } else if (emptyState.emptyType === 'cleared' && emptyState.isRequired) {
          enhancedState.validationState = emptyState.shouldShowError ? 'invalid' : 'validating';
        } else if (emptyState.emptyType === 'invalid-empty') {
          enhancedState.validationState = emptyState.shouldShowError ? 'invalid' : 'validating';
        } else {
          enhancedState.validationState = 'valid';
        }

        // Set error severity based on empty type and priority
        if (emptyState.shouldShowError) {
          enhancedState.errorSeverity = this.getErrorSeverityForEmptyField(emptyState);
        } else {
          enhancedState.errorSeverity = 'none';
        }

        // Add metadata about empty state
        enhancedState.metadata = {
          ...enhancedState.metadata,
          emptyType: emptyState.emptyType,
          isUntouched: emptyState.isUntouched,
          clearCount: this.fieldInteractionHistory.get(state.name as string)?.clearCount || 0
        };
      }

      return enhancedState;
    });
  }

  /**
   * Get error severity for empty field based on its state
   */
  private getErrorSeverityForEmptyField(emptyState: EmptyFieldState): 'error' | 'warning' | 'info' | 'none' {
    if (!emptyState.shouldShowError) return 'none';
    
    if (emptyState.emptyType === 'invalid-empty' && emptyState.isRequired) {
      return emptyState.priority === 'critical' ? 'error' : 'warning';
    }
    
    if (emptyState.emptyType === 'cleared' && emptyState.isRequired) {
      return emptyState.priority === 'critical' ? 'warning' : 'info';
    }
    
    return 'info';
  }

  /**
   * Reset field history (useful for form reset)
   */
  resetFieldHistory(fieldName?: string): void {
    if (fieldName) {
      this.fieldInteractionHistory.delete(fieldName);
    } else {
      this.fieldInteractionHistory.clear();
    }
  }

  /**
   * Get field interaction statistics
   */
  getFieldStats(fieldName: string) {
    return this.fieldInteractionHistory.get(fieldName) || null;
  }

  /**
   * Update smart empty options
   */
  updateOptions(options: Partial<SmartEmptyOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Factory function to create smart empty handler
 */
export const createSmartEmptyHandler = <TFieldValues extends FieldValues = FieldValues>(
  options?: SmartEmptyOptions
): SmartEmptyHandler<TFieldValues> => {
  return new SmartEmptyHandler<TFieldValues>(options);
};

/**
 * Hook to use smart empty handling in components
 */
export const useSmartEmptyHandling = <TFieldValues extends FieldValues = FieldValues>(
  options?: SmartEmptyOptions
) => {
  const handler = new SmartEmptyHandler<TFieldValues>(options);
  
  return {
    analyzeEmptyField: handler.analyzeEmptyField.bind(handler),
    applySmartEmptyHandling: handler.applySmartEmptyHandling.bind(handler),
    resetFieldHistory: handler.resetFieldHistory.bind(handler),
    getFieldStats: handler.getFieldStats.bind(handler),
    updateOptions: handler.updateOptions.bind(handler)
  };
};