 
import { FieldValues, Path } from 'react-hook-form';
import { FieldConfig, ValidationContext, EnhancedValidationState } from '../types/validationTypes';

/**
 * Validation middleware execution context
 */
export interface MiddlewareContext<TFieldValues extends FieldValues = FieldValues> {
  /** Field name being validated */
  fieldName: Path<TFieldValues>;
  /** Current field value */
  fieldValue: any;
  /** Field configuration */
  fieldConfig: FieldConfig<TFieldValues>;
  /** Current validation context */
  validationContext: ValidationContext;
  /** Current validation state */
  validationState: EnhancedValidationState<TFieldValues>;
  /** All form values */
  formValues: TFieldValues;
  /** Whether field is currently being validated */
  isValidating: boolean;
  /** Field interaction history */
  interactionHistory: Array<{
    action: 'focus' | 'blur' | 'change' | 'error';
    timestamp: number;
    value?: any;
  }>;
}

/**
 * Validation middleware result
 */
export interface MiddlewareResult {
  /** Whether to continue with validation */
  shouldContinue: boolean;
  /** Whether to skip this field's validation */
  skipValidation?: boolean;
  /** Custom error message to set */
  customError?: string;
  /** Whether to show/hide error */
  showError?: boolean;
  /** Custom validation delay */
  customDelay?: number;
  /** Updated field priority */
  updatedPriority?: 'critical' | 'important' | 'optional';
  /** Additional context to merge */
  contextUpdates?: Partial<ValidationContext>;
}

/**
 * Validation middleware function type
 */
export type ValidationMiddlewareFunction<TFieldValues extends FieldValues = FieldValues> = (
  context: MiddlewareContext<TFieldValues>
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Validation middleware configuration
 */
export interface MiddlewareConfig {
  /** Middleware name for identification */
  name: string;
  /** Execution priority (higher numbers execute first) */
  priority: number;
  /** Whether middleware is enabled */
  enabled: boolean;
  /** Fields to apply middleware to (empty = all fields) */
  targetFields?: string[];
  /** Validation modes to apply middleware in */
  validationModes?: ('onChange' | 'onBlur' | 'onSubmit')[];
  /** Conditions under which to run middleware */
  conditions?: {
    /** Only run on first validation */
    onFirstValidation?: boolean;
    /** Only run when field has errors */
    onlyWithErrors?: boolean;
    /** Only run when field is touched */
    onlyWhenTouched?: boolean;
    /** Only run for specific field priorities */
    fieldPriorities?: ('critical' | 'important' | 'optional')[];
  };
}

/**
 * Validation middleware with configuration
 */
export interface ValidationMiddleware<TFieldValues extends FieldValues = FieldValues> {
  config: MiddlewareConfig;
  execute: ValidationMiddlewareFunction<TFieldValues>;
}

/**
 * Validation middleware manager
 */
export class ValidationMiddlewareManager<TFieldValues extends FieldValues = FieldValues> {
  private middlewares: ValidationMiddleware<TFieldValues>[] = [];
  private executionHistory: Record<string, Array<{
    middlewareName: string;
    timestamp: number;
    result: MiddlewareResult;
  }>> = {};

  /**
   * Add middleware to the manager
   */
  addMiddleware(middleware: ValidationMiddleware<TFieldValues>): void {
    // Remove existing middleware with same name
    this.removeMiddleware(middleware.config.name);
    
    // Insert middleware in priority order
    const insertIndex = this.middlewares.findIndex(
      mw => mw.config.priority < middleware.config.priority
    );
    
    if (insertIndex === -1) {
      this.middlewares.push(middleware);
    } else {
      this.middlewares.splice(insertIndex, 0, middleware);
    }
  }

  /**
   * Remove middleware by name
   */
  removeMiddleware(name: string): boolean {
    const index = this.middlewares.findIndex(mw => mw.config.name === name);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get middleware by name
   */
  getMiddleware(name: string): ValidationMiddleware<TFieldValues> | undefined {
    return this.middlewares.find(mw => mw.config.name === name);
  }

  /**
   * Enable/disable middleware
   */
  setMiddlewareEnabled(name: string, enabled: boolean): boolean {
    const middleware = this.getMiddleware(name);
    if (middleware) {
      middleware.config.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get all middlewares
   */
  getAllMiddlewares(): ValidationMiddleware<TFieldValues>[] {
    return [...this.middlewares];
  }

  /**
   * Get enabled middlewares for a specific context
   */
  getApplicableMiddlewares(
    fieldName: Path<TFieldValues>,
    validationMode: 'onChange' | 'onBlur' | 'onSubmit',
    fieldConfig: FieldConfig<TFieldValues>,
    context: MiddlewareContext<TFieldValues>
  ): ValidationMiddleware<TFieldValues>[] {
    return this.middlewares.filter(middleware => {
      const config = middleware.config;
      
      // Check if middleware is enabled
      if (!config.enabled) return false;
      
      // Check target fields
      if (config.targetFields && config.targetFields.length > 0) {
        if (!config.targetFields.includes(fieldName as string)) return false;
      }
      
      // Check validation modes
      if (config.validationModes && config.validationModes.length > 0) {
        if (!config.validationModes.includes(validationMode)) return false;
      }
      
      // Check conditions
      if (config.conditions) {
        const { conditions } = config;
        
        // Check first validation condition
        if (conditions.onFirstValidation) {
          const history = this.executionHistory[fieldName as string] || [];
          const hasExecuted = history.some(h => h.middlewareName === config.name);
          if (hasExecuted) return false;
        }
        
        // Check error condition
        if (conditions.onlyWithErrors) {
          const hasError = !context.validationState.fieldStates[fieldName as string]?.isValid;
          if (!hasError) return false;
        }
        
        // Check touched condition
        if (conditions.onlyWhenTouched) {
          const isTouched = context.validationState.fieldStates[fieldName as string]?.isTouched;
          if (!isTouched) return false;
        }
        
        // Check field priority condition
        if (conditions.fieldPriorities && conditions.fieldPriorities.length > 0) {
          if (!conditions.fieldPriorities.includes(fieldConfig.priority)) return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Execute middlewares for a field
   */
  async executeMiddlewares(
    context: MiddlewareContext<TFieldValues>,
    validationMode: 'onChange' | 'onBlur' | 'onSubmit'
  ): Promise<MiddlewareResult> {
    const applicableMiddlewares = this.getApplicableMiddlewares(
      context.fieldName,
      validationMode,
      context.fieldConfig,
      context
    );
    
    let aggregatedResult: MiddlewareResult = {
      shouldContinue: true
    };
    
    // Execute middlewares in priority order
    for (const middleware of applicableMiddlewares) {
      try {
        const result = await middleware.execute(context);
        
        // Record execution
        this.recordExecution(context.fieldName, middleware.config.name, result);
        
        // Merge results
        aggregatedResult = this.mergeResults(aggregatedResult, result);
        
        // Stop execution if middleware says not to continue
        if (!result.shouldContinue) {
          break;
        }
        
      } catch (error) {
        console.error(`Middleware ${middleware.config.name} failed:`, error);
        // Continue with other middlewares on error
      }
    }
    
    return aggregatedResult;
  }

  /**
   * Record middleware execution
   */
  private recordExecution(
    fieldName: Path<TFieldValues>,
    middlewareName: string,
    result: MiddlewareResult
  ): void {
    const fieldKey = fieldName as string;
    if (!this.executionHistory[fieldKey]) {
      this.executionHistory[fieldKey] = [];
    }
    
    this.executionHistory[fieldKey].push({
      middlewareName,
      timestamp: Date.now(),
      result: { ...result }
    });
    
    // Keep only last 50 executions per field
    if (this.executionHistory[fieldKey].length > 50) {
      this.executionHistory[fieldKey] = this.executionHistory[fieldKey].slice(-50);
    }
  }

  /**
   * Merge middleware results
   */
  private mergeResults(existing: MiddlewareResult, newResult: MiddlewareResult): MiddlewareResult {
    return {
      shouldContinue: existing.shouldContinue && newResult.shouldContinue,
      skipValidation: existing.skipValidation || newResult.skipValidation,
      customError: newResult.customError || existing.customError,
      showError: newResult.showError !== undefined ? newResult.showError : existing.showError,
      customDelay: newResult.customDelay || existing.customDelay,
      updatedPriority: newResult.updatedPriority || existing.updatedPriority,
      contextUpdates: {
        ...existing.contextUpdates,
        ...newResult.contextUpdates
      }
    };
  }

  /**
   * Get execution history for a field
   */
  getExecutionHistory(fieldName: Path<TFieldValues>): Array<{
    middlewareName: string;
    timestamp: number;
    result: MiddlewareResult;
  }> {
    return this.executionHistory[fieldName as string] || [];
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(fieldName?: Path<TFieldValues>): void {
    if (fieldName) {
      delete this.executionHistory[fieldName as string];
    } else {
      this.executionHistory = {};
    }
  }

  /**
   * Reset all middlewares and history
   */
  reset(): void {
    this.middlewares = [];
    this.executionHistory = {};
  }
}

/**
 * Create a validation middleware
 */
export function createValidationMiddleware<TFieldValues extends FieldValues = FieldValues>(
  config: MiddlewareConfig,
  execute: ValidationMiddlewareFunction<TFieldValues>
): ValidationMiddleware<TFieldValues> {
  return {
    config: { ...config },
    execute
  };
}

/**
 * Built-in middleware: Rate limiting
 */
export function createRateLimitMiddleware<TFieldValues extends FieldValues = FieldValues>(
  maxValidationsPerSecond: number = 5
): ValidationMiddleware<TFieldValues> {
  const validationCounts: Record<string, { count: number; resetTime: number }> = {};
  
  return createValidationMiddleware(
    {
      name: 'rate-limit',
      priority: 1000,
      enabled: true
    },
    (context) => {
      const fieldKey = context.fieldName as string;
      const now = Date.now();
      const windowStart = Math.floor(now / 1000) * 1000; // 1-second window
      
      if (!validationCounts[fieldKey] || validationCounts[fieldKey].resetTime !== windowStart) {
        validationCounts[fieldKey] = { count: 0, resetTime: windowStart };
      }
      
      validationCounts[fieldKey].count++;
      
      if (validationCounts[fieldKey].count > maxValidationsPerSecond) {
        return {
          shouldContinue: false,
          skipValidation: true,
          customDelay: 1000 // Wait 1 second
        };
      }
      
      return { shouldContinue: true };
    }
  );
}

/**
 * Built-in middleware: Field dependency validation
 */
export function createDependencyMiddleware<TFieldValues extends FieldValues = FieldValues>(
  dependencies: Record<string, string[]>
): ValidationMiddleware<TFieldValues> {
  return createValidationMiddleware(
    {
      name: 'field-dependencies',
      priority: 800,
      enabled: true
    },
    (context) => {
      const fieldKey = context.fieldName as string;
      const fieldDependencies = dependencies[fieldKey];
      
      if (!fieldDependencies) {
        return { shouldContinue: true };
      }
      
      // Check if all dependencies are valid
      const invalidDependencies = fieldDependencies.filter(depField => {
        const depState = context.validationState.fieldStates[depField];
        return depState && !depState.isValid;
      });
      
      if (invalidDependencies.length > 0) {
        return {
          shouldContinue: true,
          customError: `Please fix: ${invalidDependencies.join(', ')} first`,
          showError: true
        };
      }
      
      return { shouldContinue: true };
    }
  );
}

/**
 * Built-in middleware: Conditional validation
 */
export function createConditionalMiddleware<TFieldValues extends FieldValues = FieldValues>(
  condition: (context: MiddlewareContext<TFieldValues>) => boolean,
  onTrue: Partial<MiddlewareResult> = {},
  onFalse: Partial<MiddlewareResult> = {}
): ValidationMiddleware<TFieldValues> {
  return createValidationMiddleware(
    {
      name: 'conditional-validation',
      priority: 500,
      enabled: true
    },
    (context) => {
      const result = condition(context) ? onTrue : onFalse;
      return {
        shouldContinue: true,
        ...result
      };
    }
  );
}

/**
 * Hook for using validation middleware
 */
export function useValidationMiddleware<TFieldValues extends FieldValues = FieldValues>() {
  const manager = new ValidationMiddlewareManager<TFieldValues>();
  
  return {
    addMiddleware: manager.addMiddleware.bind(manager),
    removeMiddleware: manager.removeMiddleware.bind(manager),
    getMiddleware: manager.getMiddleware.bind(manager),
    setMiddlewareEnabled: manager.setMiddlewareEnabled.bind(manager),
    getAllMiddlewares: manager.getAllMiddlewares.bind(manager),
    executeMiddlewares: manager.executeMiddlewares.bind(manager),
    getExecutionHistory: manager.getExecutionHistory.bind(manager),
    clearExecutionHistory: manager.clearExecutionHistory.bind(manager),
    reset: manager.reset.bind(manager)
  };
}