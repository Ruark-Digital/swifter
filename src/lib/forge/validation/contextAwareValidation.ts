 
import { FieldValues, Path } from 'react-hook-form';
import { FieldConfig, ValidationContext, EnhancedValidationState } from '../types/validationTypes';

/**
 * User interaction patterns that influence validation behavior
 */
export interface UserInteractionPattern {
  /** Average time spent on each field */
  averageFieldTime: number;
  /** Fields that user frequently revisits */
  frequentlyRevisitedFields: string[];
  /** User's typical form completion speed */
  completionSpeed: 'slow' | 'medium' | 'fast';
  /** Fields where user commonly makes errors */
  errorProneFields: string[];
  /** User's preferred validation timing */
  preferredValidationTiming: 'immediate' | 'onBlur' | 'onSubmit';
  /** Whether user tends to fill forms sequentially or randomly */
  fillPattern: 'sequential' | 'random';
  /** User's error correction behavior */
  errorCorrectionBehavior: 'immediate' | 'delayed' | 'batch';
}

/**
 * Context-aware validation options
 */
export interface ContextAwareOptions {
  /** Enable learning from user patterns */
  enableLearning?: boolean;
  /** Minimum interactions before adapting */
  minInteractionsForAdaptation?: number;
  /** Weight for historical patterns vs current session */
  historicalWeight?: number;
  /** Enable adaptive validation timing */
  adaptiveValidationTiming?: boolean;
  /** Enable smart field prioritization */
  smartFieldPrioritization?: boolean;
  /** Enable predictive validation */
  predictiveValidation?: boolean;
}

/**
 * Field interaction statistics
 */
export interface FieldInteractionStats {
  /** Number of times field was focused */
  focusCount: number;
  /** Total time spent in field */
  totalTimeSpent: number;
  /** Number of value changes */
  changeCount: number;
  /** Number of validation errors */
  errorCount: number;
  /** Time of last interaction */
  lastInteraction: number;
  /** Whether field was completed successfully */
  completedSuccessfully: boolean;
  /** Average time between focus and blur */
  averageSessionTime: number;
}

/**
 * Context-aware validation state
 */
export interface ContextAwareState {
  /** Current user interaction pattern */
  userPattern: UserInteractionPattern;
  /** Field interaction statistics */
  fieldStats: Record<string, FieldInteractionStats>;
  /** Adaptive validation settings */
  adaptiveSettings: {
    validationDelay: number;
    errorDisplayThreshold: number;
    priorityAdjustments: Record<string, 'critical' | 'important' | 'optional'>;
  };
  /** Prediction confidence scores */
  predictionConfidence: Record<string, number>;
}

/**
 * Context-aware validation analyzer
 */
export class ContextAwareValidator<TFieldValues extends FieldValues = FieldValues> {
  private state: ContextAwareState;
  private options: Required<ContextAwareOptions>;
  private sessionStartTime: number;
  private interactionHistory: Array<{
    fieldName: string;
    action: 'focus' | 'blur' | 'change' | 'error';
    timestamp: number;
    value?: any;
  }>;

  constructor(options: ContextAwareOptions = {}) {
    this.options = {
      enableLearning: true,
      minInteractionsForAdaptation: 10,
      historicalWeight: 0.7,
      adaptiveValidationTiming: true,
      smartFieldPrioritization: true,
      predictiveValidation: true,
      ...options
    };

    this.sessionStartTime = Date.now();
    this.interactionHistory = [];
    this.state = this.initializeState();
  }

  private initializeState(): ContextAwareState {
    return {
      userPattern: {
        averageFieldTime: 5000, // 5 seconds default
        frequentlyRevisitedFields: [],
        completionSpeed: 'medium',
        errorProneFields: [],
        preferredValidationTiming: 'onBlur',
        fillPattern: 'sequential',
        errorCorrectionBehavior: 'immediate'
      },
      fieldStats: {},
      adaptiveSettings: {
        validationDelay: 300,
        errorDisplayThreshold: 1,
        priorityAdjustments: {}
      },
      predictionConfidence: {}
    };
  }

  /**
   * Record user interaction with a field
   */
  recordInteraction(
    fieldName: Path<TFieldValues>,
    action: 'focus' | 'blur' | 'change' | 'error',
    value?: any
  ): void {
    const timestamp = Date.now();
    const fieldKey = fieldName as string;

    // Record in history
    this.interactionHistory.push({
      fieldName: fieldKey,
      action,
      timestamp,
      value
    });

    // Update field statistics
    if (!this.state.fieldStats[fieldKey]) {
      this.state.fieldStats[fieldKey] = {
        focusCount: 0,
        totalTimeSpent: 0,
        changeCount: 0,
        errorCount: 0,
        lastInteraction: timestamp,
        completedSuccessfully: false,
        averageSessionTime: 0
      };
    }

    const stats = this.state.fieldStats[fieldKey];
    stats.lastInteraction = timestamp;

    switch (action) {
      case 'focus':
        stats.focusCount++;
        break;
      case 'change':
        stats.changeCount++;
        break;
      case 'error':
        stats.errorCount++;
        break;
      case 'blur':
        // Calculate session time if we have a recent focus
        const recentFocus = this.interactionHistory
          .slice(-10)
          .reverse()
          .find(h => h.fieldName === fieldKey && h.action === 'focus');
        
        if (recentFocus) {
          const sessionTime = timestamp - recentFocus.timestamp;
          stats.totalTimeSpent += sessionTime;
          stats.averageSessionTime = stats.totalTimeSpent / stats.focusCount;
        }
        break;
    }

    // Analyze patterns if we have enough data
    if (this.options.enableLearning && 
        this.interactionHistory.length >= this.options.minInteractionsForAdaptation) {
      this.analyzeUserPatterns();
    }
  }

  /**
   * Analyze user interaction patterns
   */
  private analyzeUserPatterns(): void {
    const recentInteractions = this.interactionHistory.slice(-50); // Last 50 interactions
    
    // Analyze completion speed
    const sessionDuration = Date.now() - this.sessionStartTime;
    const interactionRate = this.interactionHistory.length / (sessionDuration / 1000);
    
    if (interactionRate > 2) {
      this.state.userPattern.completionSpeed = 'fast';
    } else if (interactionRate < 0.5) {
      this.state.userPattern.completionSpeed = 'slow';
    } else {
      this.state.userPattern.completionSpeed = 'medium';
    }

    // Analyze field revisit patterns
    const fieldVisits: Record<string, number> = {};
    recentInteractions.forEach(interaction => {
      fieldVisits[interaction.fieldName] = (fieldVisits[interaction.fieldName] || 0) + 1;
    });

    this.state.userPattern.frequentlyRevisitedFields = Object.entries(fieldVisits)
      .filter(([, count]) => count > 2)
      .map(([fieldName]) => fieldName);

    // Analyze error-prone fields
    const errorFields: Record<string, number> = {};
    recentInteractions
      .filter(i => i.action === 'error')
      .forEach(interaction => {
        errorFields[interaction.fieldName] = (errorFields[interaction.fieldName] || 0) + 1;
      });

    this.state.userPattern.errorProneFields = Object.entries(errorFields)
      .filter(([, count]) => count > 1)
      .map(([fieldName]) => fieldName);

    // Analyze fill pattern
    const fieldOrder = recentInteractions
      .filter(i => i.action === 'focus')
      .map(i => i.fieldName);
    
    const isSequential = this.isSequentialPattern(fieldOrder);
    this.state.userPattern.fillPattern = isSequential ? 'sequential' : 'random';

    // Update adaptive settings based on patterns
    this.updateAdaptiveSettings();
  }

  /**
   * Check if field access pattern is sequential
   */
  private isSequentialPattern(fieldOrder: string[]): boolean {
    if (fieldOrder.length < 3) return true;
    
    let sequentialCount = 0;
    for (let i = 1; i < fieldOrder.length; i++) {
      if (fieldOrder[i] !== fieldOrder[i - 1]) {
        sequentialCount++;
      }
    }
    
    return sequentialCount / fieldOrder.length > 0.7;
  }

  /**
   * Update adaptive settings based on user patterns
   */
  private updateAdaptiveSettings(): void {
    const { userPattern } = this.state;
    
    // Adjust validation delay based on completion speed
    switch (userPattern.completionSpeed) {
      case 'fast':
        this.state.adaptiveSettings.validationDelay = 150;
        break;
      case 'slow':
        this.state.adaptiveSettings.validationDelay = 500;
        break;
      default:
        this.state.adaptiveSettings.validationDelay = 300;
    }

    // Adjust error display threshold for error-prone fields
    userPattern.errorProneFields.forEach(fieldName => {
      this.state.adaptiveSettings.priorityAdjustments[fieldName] = 'critical';
    });

    // Lower threshold for frequently revisited fields
    userPattern.frequentlyRevisitedFields.forEach(fieldName => {
      if (!this.state.adaptiveSettings.priorityAdjustments[fieldName]) {
        this.state.adaptiveSettings.priorityAdjustments[fieldName] = 'important';
      }
    });
  }

  /**
   * Get adaptive validation delay for a field
   */
  getValidationDelay(fieldName: Path<TFieldValues>): number {
    const fieldKey = fieldName as string;
    const stats = this.state.fieldStats[fieldKey];
    
    if (!stats || !this.options.adaptiveValidationTiming) {
      return this.state.adaptiveSettings.validationDelay;
    }

    // Faster validation for error-prone fields
    if (this.state.userPattern.errorProneFields.includes(fieldKey)) {
      return Math.max(100, this.state.adaptiveSettings.validationDelay * 0.5);
    }

    // Slower validation for fields user spends more time on
    if (stats.averageSessionTime > 10000) { // More than 10 seconds
      return this.state.adaptiveSettings.validationDelay * 1.5;
    }

    return this.state.adaptiveSettings.validationDelay;
  }

  /**
   * Get adaptive field priority
   */
  getAdaptiveFieldPriority(
    fieldName: Path<TFieldValues>,
    originalPriority: 'critical' | 'important' | 'optional'
  ): 'critical' | 'important' | 'optional' {
    if (!this.options.smartFieldPrioritization) {
      return originalPriority;
    }

    const fieldKey = fieldName as string;
    const adaptivePriority = this.state.adaptiveSettings.priorityAdjustments[fieldKey];
    
    if (adaptivePriority) {
      // Don't downgrade critical fields, only upgrade
      if (originalPriority === 'critical') {
        return originalPriority;
      }
      
      // Upgrade priority based on user patterns
      if (adaptivePriority === 'critical' || 
          (adaptivePriority === 'important' && originalPriority === 'optional')) {
        return adaptivePriority;
      }
    }

    return originalPriority;
  }

  /**
   * Predict likely next field user will interact with
   */
  predictNextField(currentField: Path<TFieldValues>, allFields: Path<TFieldValues>[]): Path<TFieldValues> | null {
    if (!this.options.predictiveValidation) {
      return null;
    }

    const currentFieldKey = currentField as string;
    const recentInteractions = this.interactionHistory.slice(-20);
    
    // Find patterns of field transitions
    const transitions: Record<string, Record<string, number>> = {};
    
    for (let i = 1; i < recentInteractions.length; i++) {
      const prev = recentInteractions[i - 1];
      const curr = recentInteractions[i];
      
      if (prev.action === 'blur' && curr.action === 'focus') {
        if (!transitions[prev.fieldName]) {
          transitions[prev.fieldName] = {};
        }
        transitions[prev.fieldName][curr.fieldName] = 
          (transitions[prev.fieldName][curr.fieldName] || 0) + 1;
      }
    }

    // Find most likely next field
    const currentTransitions = transitions[currentFieldKey];
    if (currentTransitions) {
      const mostLikely = Object.entries(currentTransitions)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (mostLikely && allFields.includes(mostLikely[0] as Path<TFieldValues>)) {
        this.state.predictionConfidence[mostLikely[0]] = 
          mostLikely[1] / Object.values(currentTransitions).reduce((a, b) => a + b, 0);
        return mostLikely[0] as Path<TFieldValues>;
      }
    }

    return null;
  }

  /**
   * Apply context-aware validation logic
   */
  applyContextAwareValidation(
    fieldName: Path<TFieldValues>,
    fieldConfig: FieldConfig<TFieldValues>,
    validationState: EnhancedValidationState<TFieldValues>,
    context: ValidationContext
  ): {
    shouldValidate: boolean;
    validationDelay: number;
    priority: 'critical' | 'important' | 'optional';
    showError: boolean;
  } {
    const fieldKey = fieldName as string;
    const stats = this.state.fieldStats[fieldKey];
    const fieldState = validationState.fieldStates[fieldKey];
    
    // Get adaptive priority
    const adaptivePriority = this.getAdaptiveFieldPriority(fieldName, fieldConfig.priority);
    
    // Get adaptive validation delay
    const validationDelay = this.getValidationDelay(fieldName);
    
    // Determine if we should validate based on user patterns and current validation state
    let shouldValidate = true;
    
    // Skip validation for fast users on optional fields initially
    if (this.state.userPattern.completionSpeed === 'fast' && 
        adaptivePriority === 'optional' && 
        (!stats || stats.focusCount === 1)) {
      shouldValidate = false;
    }

    // Always validate error-prone fields
    if (this.state.userPattern.errorProneFields.includes(fieldKey)) {
      shouldValidate = true;
    }

    // Consider overall form validation progress for adaptive behavior
    if (validationState.validationProgress > 80 && adaptivePriority === 'optional') {
      // When form is mostly complete, validate optional fields more aggressively
      shouldValidate = true;
    }

    // If field is already valid and user is fast, reduce validation frequency
    if (fieldState?.isValid && this.state.userPattern.completionSpeed === 'fast') {
      shouldValidate = false;
    }

    // Determine error display based on user behavior and validation state
    let showError = true;
    
    // Hide errors initially for slow users to avoid overwhelming them
    if (this.state.userPattern.completionSpeed === 'slow' && 
        adaptivePriority === 'optional' && 
        (!stats || stats.errorCount === 0)) {
      showError = false;
    }

    // Consider form-wide validation state for error display
    if (!validationState.criticalFieldsValid && adaptivePriority !== 'critical') {
      // Hide non-critical errors when critical fields are invalid
      showError = false;
    }

    // Show errors more readily when form submission was attempted
    if (context.submissionAttempted) {
      showError = true;
    }

    return {
      shouldValidate,
      validationDelay,
      priority: adaptivePriority,
      showError
    };
  }

  /**
   * Get current context-aware state
   */
  getContextAwareState(): ContextAwareState {
    return { ...this.state };
  }

  /**
   * Reset context-aware state
   */
  reset(): void {
    this.state = this.initializeState();
    this.interactionHistory = [];
    this.sessionStartTime = Date.now();
  }

  /**
   * Update options
   */
  updateOptions(newOptions: Partial<ContextAwareOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get field interaction statistics
   */
  getFieldStats(fieldName: Path<TFieldValues>): FieldInteractionStats | null {
    return this.state.fieldStats[fieldName as string] || null;
  }

  /**
   * Get user interaction pattern
   */
  getUserPattern(): UserInteractionPattern {
    return { ...this.state.userPattern };
  }
}

/**
 * Create a context-aware validator instance
 */
export function createContextAwareValidator<TFieldValues extends FieldValues = FieldValues>(
  options?: ContextAwareOptions
): ContextAwareValidator<TFieldValues> {
  return new ContextAwareValidator<TFieldValues>(options);
}

/**
 * Hook for using context-aware validation
 */
export function useContextAwareValidation<TFieldValues extends FieldValues = FieldValues>(
  options?: ContextAwareOptions
) {
  const validator = new ContextAwareValidator<TFieldValues>(options);
  
  return {
    recordInteraction: validator.recordInteraction.bind(validator),
    getValidationDelay: validator.getValidationDelay.bind(validator),
    getAdaptiveFieldPriority: validator.getAdaptiveFieldPriority.bind(validator),
    predictNextField: validator.predictNextField.bind(validator),
    applyContextAwareValidation: validator.applyContextAwareValidation.bind(validator),
    getContextAwareState: validator.getContextAwareState.bind(validator),
    reset: validator.reset.bind(validator),
    updateOptions: validator.updateOptions.bind(validator),
    getFieldStats: validator.getFieldStats.bind(validator),
    getUserPattern: validator.getUserPattern.bind(validator)
  };
}