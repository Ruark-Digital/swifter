import { debounce } from 'lodash';
import { FieldValues, FieldPath } from 'react-hook-form';
import { FieldConfig } from '../types/validationTypes';

/**
 * Configuration options for validation debouncing
 */
export interface ValidationDebouncingOptions {
  /** Default debounce delay in milliseconds */
  defaultDelay: number;
  /** Delay for critical fields (usually shorter) */
  criticalDelay: number;
  /** Delay for important fields */
  importantDelay: number;
  /** Delay for optional fields (usually longer) */
  optionalDelay: number;
  /** Maximum delay allowed */
  maxDelay: number;
  /** Minimum delay allowed */
  minDelay: number;
  /** Whether to use adaptive delays based on field interaction */
  adaptiveDelays: boolean;
  /** Factor to reduce delay for frequently interacted fields */
  frequencyFactor: number;
}

/**
 * Default debouncing configuration
 */
export const DEFAULT_DEBOUNCING_OPTIONS: ValidationDebouncingOptions = {
  defaultDelay: 300,
  criticalDelay: 150,
  importantDelay: 300,
  optionalDelay: 500,
  maxDelay: 1000,
  minDelay: 50,
  adaptiveDelays: true,
  frequencyFactor: 0.8,
};

/**
 * Field interaction tracking for adaptive debouncing
 */
interface FieldInteraction {
  fieldName: string;
  interactionCount: number;
  lastInteraction: number;
  averageInterval: number;
  adaptedDelay: number;
}

/**
 * Validation debouncing manager
 */
export class ValidationDebouncer<TFieldValues extends FieldValues = FieldValues> {
  private options: ValidationDebouncingOptions;
  private debouncedValidators: Map<string, ReturnType<typeof debounce>> = new Map();
  private fieldInteractions: Map<string, FieldInteraction> = new Map();
  private fieldConfigs: Map<string, FieldConfig> = new Map();

  constructor(options: Partial<ValidationDebouncingOptions> = {}) {
    this.options = { ...DEFAULT_DEBOUNCING_OPTIONS, ...options };
  }

  /**
   * Update field configurations for debouncing
   */
  updateFieldConfigs(fieldConfigs: Record<string, FieldConfig>): void {
    this.fieldConfigs.clear();
    Object.entries(fieldConfigs).forEach(([fieldName, config]) => {
      this.fieldConfigs.set(fieldName, config);
    });
  }

  /**
   * Get the appropriate debounce delay for a field
   */
  private getFieldDelay(fieldName: string): number {
    const fieldConfig = this.fieldConfigs.get(fieldName);
    const interaction = this.fieldInteractions.get(fieldName);

    // Base delay based on field priority
    let baseDelay: number;
    if (fieldConfig?.priority === 'critical') {
      baseDelay = this.options.criticalDelay;
    } else if (fieldConfig?.priority === 'important') {
      baseDelay = this.options.importantDelay;
    } else if (fieldConfig?.priority === 'optional') {
      baseDelay = this.options.optionalDelay;
    } else {
      baseDelay = this.options.defaultDelay;
    }

    // Apply adaptive delay if enabled and interaction data exists
    if (this.options.adaptiveDelays && interaction) {
      const adaptiveFactor = Math.max(
        this.options.frequencyFactor,
        1 - (interaction.interactionCount * 0.05) // Reduce delay by 5% per interaction, up to limit
      );
      baseDelay = Math.round(baseDelay * adaptiveFactor);
    }

    // Ensure delay is within bounds
    return Math.max(
      this.options.minDelay,
      Math.min(this.options.maxDelay, baseDelay)
    );
  }

  /**
   * Track field interaction for adaptive debouncing
   */
  private trackFieldInteraction(fieldName: string): void {
    const now = Date.now();
    const existing = this.fieldInteractions.get(fieldName);

    if (existing) {
      const interval = now - existing.lastInteraction;
      const newAverageInterval = (existing.averageInterval + interval) / 2;
      
      this.fieldInteractions.set(fieldName, {
        ...existing,
        interactionCount: existing.interactionCount + 1,
        lastInteraction: now,
        averageInterval: newAverageInterval,
        adaptedDelay: this.getFieldDelay(fieldName),
      });
    } else {
      this.fieldInteractions.set(fieldName, {
        fieldName,
        interactionCount: 1,
        lastInteraction: now,
        averageInterval: 0,
        adaptedDelay: this.getFieldDelay(fieldName),
      });
    }
  }

  /**
   * Get or create a debounced validator for a field
   */
  getDebouncedValidator(
    fieldName: FieldPath<TFieldValues>,
    validator: () => void | Promise<void>
  ): ReturnType<typeof debounce> {
    const fieldKey = String(fieldName);
    
    // Track interaction
    this.trackFieldInteraction(fieldKey);
    
    // Get current delay for this field
    const delay = this.getFieldDelay(fieldKey);
    
    // Check if we need to update the debounced function due to delay change
    const existing = this.debouncedValidators.get(fieldKey);
    const interaction = this.fieldInteractions.get(fieldKey);
    
    if (existing && interaction && interaction.adaptedDelay === delay) {
      return existing;
    }

    // Create new debounced validator
    const debouncedValidator = debounce(validator, delay, {
      leading: false,
      trailing: true,
    });

    this.debouncedValidators.set(fieldKey, debouncedValidator);
    return debouncedValidator;
  }

  /**
   * Cancel debounced validation for a specific field
   */
  cancelFieldValidation(fieldName: FieldPath<TFieldValues>): void {
    const fieldKey = String(fieldName);
    const debouncedValidator = this.debouncedValidators.get(fieldKey);
    
    if (debouncedValidator) {
      debouncedValidator.cancel();
    }
  }

  /**
   * Cancel all pending debounced validations
   */
  cancelAllValidations(): void {
    this.debouncedValidators.forEach((debouncedValidator) => {
      debouncedValidator.cancel();
    });
  }

  /**
   * Flush all pending debounced validations immediately
   */
  flushAllValidations(): void {
    this.debouncedValidators.forEach((debouncedValidator) => {
      debouncedValidator.flush();
    });
  }

  /**
   * Flush validation for a specific field immediately
   */
  flushFieldValidation(fieldName: FieldPath<TFieldValues>): void {
    const fieldKey = String(fieldName);
    const debouncedValidator = this.debouncedValidators.get(fieldKey);
    
    if (debouncedValidator) {
      debouncedValidator.flush();
    }
  }

  /**
   * Get field interaction statistics
   */
  getFieldStats(fieldName: FieldPath<TFieldValues>): FieldInteraction | null {
    return this.fieldInteractions.get(String(fieldName)) || null;
  }

  /**
   * Get all field interaction statistics
   */
  getAllFieldStats(): Record<string, FieldInteraction> {
    const stats: Record<string, FieldInteraction> = {};
    this.fieldInteractions.forEach((interaction, fieldName) => {
      stats[fieldName] = interaction;
    });
    return stats;
  }

  /**
   * Reset interaction tracking for a field
   */
  resetFieldStats(fieldName: FieldPath<TFieldValues>): void {
    this.fieldInteractions.delete(String(fieldName));
    this.debouncedValidators.delete(String(fieldName));
  }

  /**
   * Reset all interaction tracking
   */
  resetAllStats(): void {
    this.fieldInteractions.clear();
    this.debouncedValidators.clear();
  }

  /**
   * Update debouncing options
   */
  updateOptions(newOptions: Partial<ValidationDebouncingOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Clear existing debounced validators to apply new delays
    this.debouncedValidators.clear();
  }

  /**
   * Get current debouncing options
   */
  getOptions(): ValidationDebouncingOptions {
    return { ...this.options };
  }
}

/**
 * Create a validation debouncer instance
 */
export function createValidationDebouncer<TFieldValues extends FieldValues = FieldValues>(
  options?: Partial<ValidationDebouncingOptions>
): ValidationDebouncer<TFieldValues> {
  return new ValidationDebouncer<TFieldValues>(options);
}

/**
 * Hook for using validation debouncing
 */
export function useValidationDebouncing<TFieldValues extends FieldValues = FieldValues>(
  options?: Partial<ValidationDebouncingOptions>
): ValidationDebouncer<TFieldValues> {
  // In a real React hook, you'd use useMemo or useRef to maintain the instance
  // For now, we'll create a new instance (this should be memoized in actual usage)
  return createValidationDebouncer<TFieldValues>(options);
}