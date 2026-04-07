 
import { useCallback, useRef, useMemo } from 'react';
import { FieldValues, Path, FieldErrors } from 'react-hook-form';
import { ForgeControl } from '../types';
import {
  EnhancedValidationState,
  ValidationContext,
  FieldConfig,
  ValidationStrategy,
  ButtonValidationState,
  EnhancedValidationOptions
} from '../types/validationTypes';
import {
  createEnhancedValidationState,
  createValidationContext,
  updateValidationContext,
  getButtonValidationState,
  convertErrorsToFieldStates,
  createFieldConfig,
} from '../utils/validationUtils';
import {
  createProgressiveValidator
} from '../validation/progressiveValidation';
import {
  ValidationDebouncer,
  ValidationDebouncingOptions,
  DEFAULT_DEBOUNCING_OPTIONS
} from '../validation/validationDebouncing';
import {
  createContextAwareValidator,
  ContextAwareOptions
} from '../validation/contextAwareValidation';
import {
  ValidationMiddlewareManager,
  MiddlewareContext,
  MiddlewareResult,
  ValidationMiddleware
} from '../validation/validationMiddleware';
import { isEmptyObject } from '../utils';

export type UseEnhancedValidationProps<TFieldValues extends FieldValues = FieldValues> = {
  control: ForgeControl<TFieldValues>;
  options?: EnhancedValidationOptions<TFieldValues> & {
    debouncingOptions?: Partial<ValidationDebouncingOptions>;
    contextAwareOptions?: ContextAwareOptions;
  };
  strategy?: ValidationStrategy;
};

export type UseEnhancedValidationReturn<TFieldValues extends FieldValues = FieldValues> = {
  validationState: EnhancedValidationState<TFieldValues>;
  validationContext: ValidationContext;
  buttonState: ButtonValidationState;
  setValid: (shouldUpdateValid?: boolean) => Promise<void>;
  updateContext: (updates: Partial<ValidationContext>) => void;
  getFieldConfig: (fieldName: Path<TFieldValues>) => FieldConfig<TFieldValues>;
  addMiddleware: (middleware: ValidationMiddleware<TFieldValues>) => void;
  removeMiddleware: (name: string) => boolean;
  getMiddleware: (name: string) => ValidationMiddleware<TFieldValues> | undefined;
  setMiddlewareEnabled: (name: string, enabled: boolean) => boolean;
  getAllMiddlewares: () => ValidationMiddleware<TFieldValues>[];
  executeMiddlewares: (context: MiddlewareContext<TFieldValues>, validationMode: 'onChange' | 'onBlur' | 'onSubmit') => Promise<MiddlewareResult>;
  getMiddlewareExecutionHistory: (fieldName: Path<TFieldValues>) => any[];
  clearMiddlewareHistory: (fieldName?: Path<TFieldValues>) => void;
  // Debouncing methods
  cancelValidation: (fieldName?: Path<TFieldValues>) => void;
  flushValidation: (fieldName?: Path<TFieldValues>) => void;
  resetDebouncing: () => void;
  getFieldInteractionStats: (fieldName: Path<TFieldValues>) => any;
  // Context-aware methods
  recordInteraction: (fieldName: Path<TFieldValues>, action: 'focus' | 'blur' | 'change' | 'error', value?: any) => void;
  getAdaptiveFieldPriority: (fieldName: Path<TFieldValues>, originalPriority: 'critical' | 'important' | 'optional') => 'critical' | 'important' | 'optional';
  predictNextField: (currentField: Path<TFieldValues>, allFields: Path<TFieldValues>[]) => Path<TFieldValues> | null;
  getContextAwareState: () => any;
  resetContextAware: () => void;
  getUserPattern: () => any;
  // Progressive validation methods
  getValidationProgress: (enhancedState: EnhancedValidationState<TFieldValues>) => number;
  getNextFieldToFocus: (enhancedState: EnhancedValidationState<TFieldValues>) => string | null;
  resetValidationHistory: () => void;
};

export const useEnhancedValidation = <TFieldValues extends FieldValues = FieldValues>({
  control,
  options = {},
  strategy = 'progressive'
}: UseEnhancedValidationProps<TFieldValues>): UseEnhancedValidationReturn<TFieldValues> => {
  const {
    fieldConfigs = [],
    middleware = [],
    smartEmptyHandling = true,
    progressiveValidation = true,
    debounceValidation = true,
    contextAware = true,
    debouncingOptions = DEFAULT_DEBOUNCING_OPTIONS,
    contextAwareOptions = {}
  } = options;

  // Refs for mutable state
  const validationContextRef = useRef<ValidationContext>(createValidationContext({
    validationMode: control._options.mode || 'onChange'
  }));
  const fieldConfigsRef = useRef<FieldConfig<TFieldValues>[]>([...fieldConfigs]);
  
  // Create middleware manager
  const middlewareManager = useMemo(() => {
    const manager = new ValidationMiddlewareManager<TFieldValues>();
    // Add initial middlewares
    middleware.forEach(mw => manager.addMiddleware(mw));
    return manager;
  }, [middleware]);
  
  // Create field configs for all registered fields if not provided
  const allFieldConfigs = useMemo(() => {
    const existingConfigs = new Set(fieldConfigsRef.current.map(config => config.name));
    const allConfigs = [...fieldConfigsRef.current];
    
    Object.keys(control._fields).forEach(fieldName => {
      if (!existingConfigs.has(fieldName as Path<TFieldValues>)) {
        allConfigs.push(createFieldConfig(fieldName as Path<TFieldValues>));
      }
    });
    
    return allConfigs;
  }, [fieldConfigs, control._fields]);

  // Create progressive validator
  const progressiveValidator = useMemo(() => 
    createProgressiveValidator(
      allFieldConfigs,
      validationContextRef.current,
      smartEmptyHandling ? undefined : { priorityBasedHandling: false, immediateRequiredValidation: false }
    ),
    [allFieldConfigs, validationContextRef.current, smartEmptyHandling]
  );

  // Create validation debouncer
  const validationDebouncer = useMemo(() => 
    new ValidationDebouncer(debouncingOptions),
    [debouncingOptions]
  );

  // Create context-aware validator
  const contextAwareValidator = useMemo(() => 
    createContextAwareValidator<TFieldValues>(contextAwareOptions),
    [contextAwareOptions]
  );



  // Enhanced _setValid function
  const setValid = useCallback(async (shouldUpdateValid?: boolean) => {
    if (
      !control._options.disabled &&
      (control._proxyFormState?.isValid ||
        shouldUpdateValid)
    ) {
      let isValid: boolean;
      
      // Use existing validation logic
      if (control._options.resolver) {
        const formValues = control._state?.mount ? control._formValues : control._defaultValues;
        const schemaResult = await control._options.resolver(
          formValues as TFieldValues,
          control._options.context,
          {
            criteriaMode: control._options.criteriaMode,
            names: [],
            fields: {},
            shouldUseNativeValidation: control._options.shouldUseNativeValidation
          }
        );
        isValid = isEmptyObject(schemaResult.errors);
      } else {
        // Use built-in validation (simplified version)
        isValid = Object.keys(control._formState.errors).length === 0;
      }

      // Create enhanced validation state
      let enhancedState: EnhancedValidationState<TFieldValues>;
      
      if (strategy === 'progressive') {
        enhancedState = await progressiveValidator.validateProgressively(
          control._formState.errors as FieldErrors<TFieldValues>,
          (control.getValues ? control.getValues() : control._formValues) as TFieldValues,
          control._formState.touchedFields as Record<string, boolean>,
          {} // validating fields - would need to track this separately
        );
      } else {
        const fieldStates = convertErrorsToFieldStates<TFieldValues>(
          control._formState.errors as FieldErrors<TFieldValues>,
          allFieldConfigs,
          (control.getValues ? control.getValues() : control._formValues) as TFieldValues,
          control._formState.touchedFields as Record<string, boolean>,
          {} // validating fields - would need to track this separately
        );
        enhancedState = createEnhancedValidationState(fieldStates);
      }
      
      // Apply middleware if available
      if (middlewareManager.getAllMiddlewares().length > 0) {
        // Run middleware for each field
        for (const config of allFieldConfigs) {
          const fieldValue = ((control.getValues ? control.getValues() : control._formValues) as TFieldValues)[config.name];
          const fieldState = enhancedState.fieldStates[config.name as string];
          
          const middlewareContext: MiddlewareContext<TFieldValues> = {
            fieldName: config.name,
            fieldValue,
            fieldConfig: config,
            validationContext: validationContextRef.current,
            validationState: enhancedState,
            formValues: (control.getValues ? control.getValues() : control._formValues) as TFieldValues,
            isValidating: false, // Would need to track this separately
            interactionHistory: [] // Would need to track this separately
          };
          
          const validationMode = control._options.mode || 'onChange';
          const middlewareResult = await middlewareManager.executeMiddlewares(
            middlewareContext,
            validationMode as 'onChange' | 'onBlur' | 'onSubmit'
          );
          
          // Apply middleware results
          if (middlewareResult.skipValidation) {
            continue;
          }
          
          if (middlewareResult.customError && fieldState) {
            fieldState.errors = [middlewareResult.customError];
            fieldState.isValid = false;
          }
          
          if (middlewareResult.showError !== undefined && fieldState) {
            fieldState.shouldShowError = middlewareResult.showError;
          }
          
          if (middlewareResult.updatedPriority) {
            config.priority = middlewareResult.updatedPriority;
          }
          
          if (middlewareResult.contextUpdates) {
            validationContextRef.current = updateValidationContext(
              validationContextRef.current,
              middlewareResult.contextUpdates
            );
          }
        }
      }

      // Update form state if validity changed
      if (isValid !== control._formState.isValid) {
        control._subjects.state.next({
          isValid: progressiveValidation ? enhancedState.isPartiallyValid : isValid,
        });
      }

      // Store enhanced state (would need to extend control or use external state)
      (control as any)._enhancedValidationState = enhancedState;
    }
  }, [control, allFieldConfigs, progressiveValidation, contextAware]);

  // Get field configuration
  const getFieldConfig = useCallback((fieldName: Path<TFieldValues>) => {
    return allFieldConfigs.find(config => config.name === fieldName) ||
           createFieldConfig(fieldName);
  }, [allFieldConfigs]);

  // Debounced validation function
  const debouncedValidate = useCallback(async (
    fieldName?: Path<TFieldValues>,
    shouldUpdateValid?: boolean
  ) => {
    if (!debounceValidation) {
      return setValid(shouldUpdateValid);
    }

    const fieldConfig = fieldName ? getFieldConfig(fieldName) : undefined;

    // Get adaptive priority and validation delay if context-aware is enabled
    if (contextAware && fieldName && fieldConfig) {
      // Currently, ValidationDebouncer computes delay internally based on priority.
      // If needed, we could update debouncer's field configs here with the adaptive priority.
      const adaptivePriority = contextAwareValidator.getAdaptiveFieldPriority(fieldName, fieldConfig.priority || 'optional');
      // Optionally update the field config's priority for debouncer calculations.
      const updatedConfig: FieldConfig<TFieldValues> = { ...fieldConfig, priority: adaptivePriority };
      const configMap: Record<string, any> = {};
      for (const cfg of allFieldConfigs) {
        configMap[String(cfg.name)] = cfg as any;
      }
      configMap[String(fieldName)] = updatedConfig as any;
      (validationDebouncer as any).updateFieldConfigs(configMap);
    }

    const debouncedValidator = validationDebouncer.getDebouncedValidator(
      (fieldName || ('form' as unknown)) as Path<TFieldValues>,
      async () => setValid(shouldUpdateValid)
    );
    
    return debouncedValidator();
  }, [setValid, debounceValidation, validationDebouncer, control, getFieldConfig, contextAware, contextAwareValidator, allFieldConfigs]);

  // Update validation context
  const updateContext = useCallback((updates: Partial<ValidationContext>) => {
    validationContextRef.current = updateValidationContext(
      validationContextRef.current,
      updates
    );
  }, []);

  // Add middleware
  const addMiddleware = useCallback((newMiddleware: ValidationMiddleware<TFieldValues>) => {
    middlewareManager.addMiddleware(newMiddleware);
  }, [middlewareManager]);

  // Remove middleware
  const removeMiddleware = useCallback((name: string) => {
    return middlewareManager.removeMiddleware(name);
  }, [middlewareManager]);

  // Get middleware
  const getMiddleware = useCallback((name: string) => {
    return middlewareManager.getMiddleware(name);
  }, [middlewareManager]);

  // Set middleware enabled
  const setMiddlewareEnabled = useCallback((name: string, enabled: boolean) => {
    return middlewareManager.setMiddlewareEnabled(name, enabled);
  }, [middlewareManager]);

  // Get all middlewares
  const getAllMiddlewares = useCallback(() => {
    return middlewareManager.getAllMiddlewares();
  }, [middlewareManager]);

  // Execute middlewares
  const executeMiddlewares = useCallback(async (
    context: MiddlewareContext<TFieldValues>,
    validationMode: 'onChange' | 'onBlur' | 'onSubmit'
  ) => {
    return middlewareManager.executeMiddlewares(context, validationMode);
  }, [middlewareManager]);

  // Get middleware execution history
  const getMiddlewareExecutionHistory = useCallback((fieldName: Path<TFieldValues>) => {
    return middlewareManager.getExecutionHistory(fieldName);
  }, [middlewareManager]);

  // Clear middleware history
  const clearMiddlewareHistory = useCallback((fieldName?: Path<TFieldValues>) => {
    middlewareManager.clearExecutionHistory(fieldName);
  }, [middlewareManager]);

  // Get current validation state
  const validationState = useMemo(() => {
    const enhancedState = (control as any)._enhancedValidationState;
    if (enhancedState) {
      return enhancedState;
    }

    // Fallback to basic state
    const fieldStates = convertErrorsToFieldStates<TFieldValues>(
      control._formState.errors as FieldErrors<TFieldValues>,
      allFieldConfigs,
      ((control._formValues || {}) as unknown) as TFieldValues,
      control._formState.touchedFields as Record<string, boolean>
    );

    return createEnhancedValidationState(fieldStates);
  }, [control._formState.errors, control._formState.touchedFields, allFieldConfigs]);

  // Get button state
  const buttonState = useMemo(() => {
    return strategy === 'progressive'
      ? progressiveValidator.getButtonValidationState(validationState)
      : getButtonValidationState(
          validationState,
          validationContextRef.current,
          strategy
        );
  }, [validationState, strategy, progressiveValidator]);

  return {
    validationState,
    validationContext: validationContextRef.current,
    buttonState,
    setValid: (shouldUpdateValid?: boolean) => debouncedValidate(undefined, shouldUpdateValid),
    updateContext,
    getFieldConfig,
    // Middleware methods
    addMiddleware,
    removeMiddleware,
    getMiddleware,
    setMiddlewareEnabled,
    getAllMiddlewares,
    executeMiddlewares,
    getMiddlewareExecutionHistory,
    clearMiddlewareHistory,
    // Progressive validation methods
    getValidationProgress: (enhancedState: EnhancedValidationState<TFieldValues>) => 
      progressiveValidator.getValidationProgress(enhancedState),
    getNextFieldToFocus: (enhancedState: EnhancedValidationState<TFieldValues>) => 
      progressiveValidator.getNextFieldToFocus(enhancedState),
    resetValidationHistory: () => progressiveValidator.resetValidationHistory(),
    // Debouncing methods
    cancelValidation: (fieldName?: Path<TFieldValues>) => 
      fieldName ? validationDebouncer.cancelFieldValidation(fieldName) : validationDebouncer.cancelAllValidations(),
    flushValidation: (fieldName?: Path<TFieldValues>) => 
      fieldName ? validationDebouncer.flushFieldValidation(fieldName) : validationDebouncer.flushAllValidations(),
    resetDebouncing: () => validationDebouncer.resetAllStats(),
    getFieldInteractionStats: (fieldName: Path<TFieldValues>) => 
      validationDebouncer.getFieldStats(fieldName),
    // Context-aware methods
    recordInteraction: (fieldName: Path<TFieldValues>, action: 'focus' | 'blur' | 'change' | 'error', value?: any) => 
      contextAwareValidator.recordInteraction(fieldName, action, value),
    getAdaptiveFieldPriority: (fieldName: Path<TFieldValues>, originalPriority: 'critical' | 'important' | 'optional') => 
      contextAwareValidator.getAdaptiveFieldPriority(fieldName, originalPriority),
    predictNextField: (currentField: Path<TFieldValues>, allFields: Path<TFieldValues>[]) => 
      contextAwareValidator.predictNextField(currentField, allFields),
    getContextAwareState: () => contextAwareValidator.getContextAwareState(),
    resetContextAware: () => contextAwareValidator.reset(),
    getUserPattern: () => contextAwareValidator.getUserPattern()
  };
};