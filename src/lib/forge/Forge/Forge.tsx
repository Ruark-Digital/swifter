 
"use client";

import {
  Children,
  cloneElement,
  createElement,
  useImperativeHandle,
  useEffect,
} from "react";
import { FieldValues, FormProvider } from "react-hook-form";
import { ForgeProps } from "../types";
import {
  isButtonSlot,
  isElementSlot,
  isInputSlot,
  isNestedSlot,
  isReactNative,
  // isWeb,
} from "../utils";
import {
  getComponentType,
  getEventHandlerName,
  // mergePlatformProps,
  // REACT_NATIVE_COMPONENTS,
} from "../reactNative";
import { Forger } from "../Forger";
import { DevTool } from "@hookform/devtools";
import { useEnhancedValidation } from "../hooks/useEnhancedValidation";
import { ButtonValidationState } from "../types/validationTypes";
import { getButtonValidationState } from "../utils/validationUtils";

export const Forge = <TFieldValues extends FieldValues = FieldValues>({
  className,
  children,
  onSubmit,
  control,
  ref,
  isNative,
  debug,
  platform = 'auto',
  // Enhanced validation options
  validationStrategy = 'progressive',
  fieldConfigs,
  useEnhancedValidation: useEnhancedValidationProp = true,
  smartEmptyHandling = true,
  progressiveValidation = true,
  debounceValidation = true,
  contextAware = true,
  ...rest
}: ForgeProps<TFieldValues>) => {
  // Determine the actual platform to use
  const actualPlatform = platform === 'auto' 
    ? (isReactNative ? 'react-native' : 'web')
    : platform;
  
  const isRNMode = actualPlatform === 'react-native' || (isNative && isReactNative);

  // Enhanced validation is always on; the `useEnhancedValidation` prop is kept
  // in the type for API compatibility but no longer gates the hook call (a
  // conditional hook call violates the rules-of-hooks and no caller actually
  // passes `false` today).
  void useEnhancedValidationProp;
  const enhancedValidation = useEnhancedValidation({
    control,
    strategy: validationStrategy,
    options: {
      fieldConfigs,
      smartEmptyHandling,
      progressiveValidation,
      debounceValidation,
      contextAware,
      debouncingOptions: debounceValidation ? {
        defaultDelay: 300,
        maxDelay: 1000,
      } : undefined,
      contextAwareOptions: contextAware ? {
         enableLearning: true,
         minInteractionsForAdaptation: 5,
         historicalWeight: 0.3,
         adaptiveValidationTiming: true,
         smartFieldPrioritization: true,
         predictiveValidation: true,
       } : undefined,
    },
  });

  // Use enhanced validation state if available, otherwise fallback to control state
  const enhancedValidationState = enhancedValidation?.validationState || control._enhancedValidationState;
  const buttonValidationState: ButtonValidationState = enhancedValidationState
    ? getButtonValidationState(
        enhancedValidationState,
        enhancedValidation?.validationContext || {
          userInteractionCount: 0,
          lastInteractionTime: Date.now(),
          submissionAttempted: false,
          validationMode: control._options.mode || 'onChange'
        },
        validationStrategy
      )
    : {
        disabled: false,
        variant: 'default',
        message: undefined,
      };

  // Update control with enhanced validation state
  useEffect(() => {
    if (enhancedValidation && enhancedValidation.validationState) {
      control._enhancedValidationState = enhancedValidation.validationState;
      control._validationContext = enhancedValidation.validationContext;
    }
  }, [enhancedValidation?.validationState, enhancedValidation?.validationContext, control]);
  // Recursive function to traverse and process the entire nested tree of children
  const processChildrenRecursively = (children: any, depth = 0): any => {
    // Prevent infinite recursion with a reasonable depth limit
    if (depth > 10) {
      return children;
    }

    return Children.map(children, (child) => {
      // Skip non-React elements (strings, numbers, null, undefined)
      if (!isElementSlot(child)) {
        return child;
      }

      // Handle button elements - attach form submit handler with enhanced validation
      if (isButtonSlot(child)) {
        const childProps = (child as any).props as any;
        const isSubmitButton = childProps.type === 'submit' || childProps.role === 'submit' || !childProps.type;
        
        if (isSubmitButton) {
          const handleSubmit = (e: any) => {
            e.preventDefault();
            
            // Record interaction for context-aware validation
            if (enhancedValidation?.updateContext) {
              enhancedValidation.updateContext({
                submissionAttempted: true,
                lastInteractionTime: Date.now(),
              });
            }
            
            // Only submit if validation allows it
            if (!buttonValidationState.disabled) {
              control.handleSubmit(onSubmit)(e);
            }
          };

          return cloneElement(child, {
            ...child.props,
            onClick: handleSubmit,
            disabled: buttonValidationState.disabled,
            "data-validation-state": !buttonValidationState.disabled ? "valid" : "invalid",
            "data-validation-progress": enhancedValidationState ? Math.round(enhancedValidationState.validationProgress) : 0,
            "data-has-errors": enhancedValidationState ? !enhancedValidationState.isValid : false,
            "data-has-critical-errors": enhancedValidationState ? !enhancedValidationState.criticalFieldsValid : false,
            "data-has-warnings": enhancedValidationState ? (enhancedValidationState.isPartiallyValid && !enhancedValidationState.isValid) : false,
            "data-validation-variant": buttonValidationState.variant,
          });
        }
        
        return cloneElement(child, {
          onClick: childProps.onClick,
        } as any);
      }

      // Handle input elements in native/React Native mode - register with form control
      if (isInputSlot(child) && (isNative || isRNMode)) {
        const childProps = (child as any).props as any;
        const componentType = getComponentType(child);
        const eventHandlerName = getEventHandlerName(componentType);
        const registrationProps = control.register(childProps.name);
        
        // Merge platform-specific props
        const platformProps = isRNMode ? {
          [eventHandlerName]: registrationProps.onChange,
          onBlur: registrationProps.onBlur,
          ref: registrationProps.ref,
          name: registrationProps.name,
        } : registrationProps;
        
        return createElement((child as any).type, {
          ...childProps,
          ...platformProps,
          key: childProps.name,
        });
      }

      // Handle input elements for web mode - enhanced validation integration
      if (isInputSlot(child) && !isNative && !isRNMode) {
        // Enhanced input props with validation integration
        const childProps = (child as any).props as any;
        const enhancedInputProps = {
          ...childProps,
          control,
          // Add enhanced validation methods if available
          ...(enhancedValidation && {
            onFocus: (e: any) => {
              // Record interaction for context-aware validation
              if (childProps.name && enhancedValidation.recordInteraction) {
                enhancedValidation.recordInteraction(childProps.name, 'focus', {
                  timestamp: Date.now(),
                });
              }
              // Call original onFocus if it exists
              if (childProps.onFocus) {
                childProps.onFocus(e);
              }
            },
            onBlur: (e: any) => {
              // Record interaction and trigger validation
              if (childProps.name && enhancedValidation.recordInteraction) {
                enhancedValidation.recordInteraction(childProps.name, 'blur', {
                  timestamp: Date.now(),
                });
              }
              // Call original onBlur if it exists
              if (childProps.onBlur) {
                childProps.onBlur(e);
              }
            },
            onChange: (e: any) => {
              // Record interaction for context-aware validation
              if (childProps.name && enhancedValidation.recordInteraction) {
                enhancedValidation.recordInteraction(childProps.name, 'change', {
                  timestamp: Date.now(),
                  value: e.target?.value || e,
                });
              }
              // Call original onChange if it exists
              if (childProps.onChange) {
                childProps.onChange(e);
              }
            },
          }),
        };

        return (
          <Forger
            key={(child as any).key || `input-${depth}`}
            {...enhancedInputProps}
          />
        );
      }

      // Get child's children for recursive processing
      const childChildren = ((child as any).props as any)?.children;
      
      // If this element has children, process them recursively
      if (childChildren) {
        const processedChildren = processChildrenRecursively(childChildren, depth + 1);
        
        // For nested container elements (div, section, main), use createElement to preserve structure
        if (isNestedSlot(child)) {
          return createElement((child as any).type, {
            ...{
              ...((child as any).props as any),
              children: processedChildren,
            },
          });
        }
        
        // For other elements with children, clone and update
        return cloneElement(child, {
          ...{ control },
          children: processedChildren,
        } as any);
      }

      // For leaf elements without children: skip host DOM elements entirely, and for
      // component leaves only inject `control` (the validation context is already
      // available via FormProvider; spreading enhancedValidationState/setValid/etc.
      // onto components that forward `{...props}` to a DOM node — e.g. shadcn Button —
      // surfaces them as unknown lowercase DOM attrs).
      if (typeof (child as any).type === "string") {
        return child;
      }
      return cloneElement(child, { control } as any);
    });
  };

  const updatedChildren = processChildrenRecursively(children);

  useImperativeHandle(
    ref,
    () => {
      return {
        onSubmit: () => {
          control.handleSubmit(onSubmit)()
        },
      };
    },
    [onSubmit, control]
  );

  const renderFieldProps = control.hasFields
    ? control?.fields?.map((inputs, index) => (
        <Forger key={index} {...inputs} />
      ))
    : null;

  return (
    <FormProvider
      {...(control as unknown as any)}
      control={control as unknown as any}
    >
      <form 
        className={className} 
        onSubmit={(e) => {
          e.preventDefault();
        }}
        {...rest}
      >
        {renderFieldProps}
        {updatedChildren}
      </form>
      {debug && <DevTool control={control} />}
    </FormProvider>
  );
};
