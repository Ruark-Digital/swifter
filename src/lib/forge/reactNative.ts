 
/**
 * React Native specific utilities and helpers for the Forge library
 * This file provides React Native compatible implementations for form handling
 */

import { isReactNative, isWeb } from './utils';

// React Native component type mappings
export const REACT_NATIVE_COMPONENTS = {
  TextInput: 'TextInput',
  Switch: 'Switch',
  Picker: 'Picker',
  Slider: 'Slider',
  CheckBox: 'CheckBox',
  RadioButton: 'RadioButton',
} as const;

// Platform-specific event handler mapping
export const getEventHandlerName = (componentType: string): string => {
  if (!isReactNative) return 'onChange';
  
  switch (componentType) {
    case REACT_NATIVE_COMPONENTS.TextInput:
      return 'onChangeText';
    case REACT_NATIVE_COMPONENTS.Switch:
    case REACT_NATIVE_COMPONENTS.Picker:
    case REACT_NATIVE_COMPONENTS.Slider:
      return 'onValueChange';
    case REACT_NATIVE_COMPONENTS.CheckBox:
    case REACT_NATIVE_COMPONENTS.RadioButton:
      return 'onValueChange';
    default:
      return 'onChange';
  }
};

// Platform-specific value property mapping
export const getValuePropertyName = (componentType: string): string => {
  if (!isReactNative) return 'value';
  
  switch (componentType) {
    case REACT_NATIVE_COMPONENTS.TextInput:
      return 'value';
    case REACT_NATIVE_COMPONENTS.Switch:
    case REACT_NATIVE_COMPONENTS.CheckBox:
    case REACT_NATIVE_COMPONENTS.RadioButton:
      return 'value';
    case REACT_NATIVE_COMPONENTS.Picker:
    case REACT_NATIVE_COMPONENTS.Slider:
      return 'selectedValue';
    default:
      return 'value';
  }
};

// React Native validation helpers
export const setReactNativeError = (ref: any, error?: string) => {
  if (!isReactNative || !ref?.setNativeProps) return;
  
  ref.setNativeProps({
    error: error || undefined,
    style: error ? { borderColor: 'red' } : undefined
  });
};

// Platform-specific component detection
export const getComponentType = (component: any): string => {
  if (!component) return 'unknown';
  
  // Check displayName first (common in React Native)
  if (component.displayName) {
    return component.displayName;
  }
  
  // Check type property
  if (component.type) {
    return typeof component.type === 'string' ? component.type : component.type.displayName || 'unknown';
  }
  
  // For web components, check tagName
  if (isWeb && component.tagName) {
    return component.tagName.toLowerCase();
  }
  
  return 'unknown';
};

// Cross-platform props merger
export const mergePlatformProps = (baseProps: any, platformProps?: { web?: any; reactNative?: any }) => {
  if (!platformProps) return baseProps;
  
  const platformSpecificProps = isReactNative ? platformProps.reactNative : platformProps.web;
  
  return {
    ...baseProps,
    ...platformSpecificProps,
  };
};

// React Native specific validation rules
export const REACT_NATIVE_VALIDATION_RULES = {
  textInput: {
    maxLength: (value: string, max: number) => value.length <= max,
    minLength: (value: string, min: number) => value.length >= min,
    pattern: (value: string, pattern: RegExp) => pattern.test(value),
  },
  numeric: {
    max: (value: number, max: number) => value <= max,
    min: (value: number, min: number) => value >= min,
  },
  required: (value: any) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  },
};

// React Native file handling (for image picker, document picker, etc.)
export const handleReactNativeFile = (file: any) => {
  if (!isReactNative) return file;
  
  // Handle React Native image picker result
  if (file && typeof file === 'object' && file.uri) {
    return {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || file.name || 'image.jpg',
      size: file.fileSize || file.size,
    };
  }
  
  return file;
};

// Platform detection utilities
export const getPlatform = () => {
  if (isReactNative) return 'react-native';
  if (isWeb) return 'web';
  return 'unknown';
};

export const isValidReactNativeComponent = (component: any): boolean => {
  if (!isReactNative || !component) return false;
  
  const componentType = getComponentType(component);
  return Object.values(REACT_NATIVE_COMPONENTS).includes(componentType as any);
};