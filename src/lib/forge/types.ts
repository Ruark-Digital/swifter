/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Component, ReactNode, RefObject, FormHTMLAttributes } from "react";
import { Accept } from "react-dropzone";
import {
  Control,
  DefaultValues,
  FieldValues,
  Path,
  RegisterOptions,
  Resolver,
  UseFormReturn,
} from "react-hook-form";
import {
  EnhancedValidationState,
  ValidationContext,
  FieldConfig,
  ValidationStrategy
} from "./types/validationTypes";

export type FormPropsRef = {
  onSubmit: () => void;
};

export type ForgeControl<
  T extends FieldValues,
  TFieldProps = unknown
> = Control<T, any> & {
  fields?: FieldProps<TFieldProps>[];
  hasFields?: boolean;
  _enhancedValidationState?: EnhancedValidationState<T>;
  _validationContext?: ValidationContext;
  _fieldConfigs?: FieldConfig<T>[];
  _validationStrategy?: ValidationStrategy;
  _useEnhancedValidation?: boolean;
  getValues?: () => T;
};

type AsyncDefaultValues<TFieldValues> = (
  payload?: unknown
) => Promise<TFieldValues>;

export type ForgerProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "name"
> & {
  name: Path<TFieldValues>;
  component: any;
  label?: string | JSX.Element;
  onChange?: (value: string) => void;
  accept?: Accept;
  multiple?: boolean;
  control?: ForgeControl<TFieldValues>;
} & Record<string, any>;

export type ForgerControllerProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  name: Path<TFieldValues>;
  className?: string;
  rules?: Omit<
    RegisterOptions<TFieldValues, any>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  transform?: {
    input?: (value: string) => string;
    output?: (val: string) => string;
  };
  component: Component<ForgerSlotProps>;
  handler?: string;
  methods: UseFormReturn<TFieldValues>;
  dependencies?: any[];
} & Record<string, any>;

export type ForgerSlotProps = {
  name: string;
  error: string;
  value: string;
  placeholder?: string;
  control: ForgeControl<FieldValues>;
  onBlur: RegisterOptions["onBlur"];
  onChange: RegisterOptions["onChange"];
};

export type TForgerProps = {
  name: string;
  component: typeof Component<ForgerSlotProps> | any;
  label?: string;
};

export type FieldProps<
  TFieldProps = unknown,
  TFieldValues extends FieldValues = FieldValues
> = ForgerProps<TFieldValues> & TFieldProps;

export type UseForgeProps<
  TFieldProps = unknown,
  TFieldValues extends FieldValues = FieldValues
> = {
  defaultValues?:
    | AsyncDefaultValues<TFieldValues>
    | DefaultValues<TFieldValues>
    | undefined;
  resolver?: Resolver<TFieldValues>;
  fields?: FieldProps<TFieldProps>[];
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  shouldUnregister?: boolean;
  // Enhanced validation options
  validationStrategy?: ValidationStrategy;
  fieldConfigs?: FieldConfig<TFieldValues>[];
  useEnhancedValidation?: boolean;
  smartEmptyHandling?: boolean;
  progressiveValidation?: boolean;
  debounceValidation?: boolean;
  contextAware?: boolean;
};

export type UseForgeResult<T extends FieldValues, TFieldProps = unknown> = Omit<
  UseFormReturn<T>,
  "control"
> & {
  control: ForgeControl<T, TFieldProps>;
};

export type ForgeProps<
  TFieldValues extends FieldValues,
  TFieldProps = unknown
> = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onSubmit: (submit: TFieldValues) => void;
  className?: string;
  children?: ReactNode;
  control: ForgeControl<TFieldValues, TFieldProps>;
  ref?: RefObject<FormPropsRef | null>;
  isNative?: boolean;
  debug?: boolean;
  platform?: 'web' | 'react-native' | 'auto';
  // Enhanced validation options
  validationStrategy?: ValidationStrategy;
  fieldConfigs?: FieldConfig<TFieldValues>[];
  useEnhancedValidation?: boolean;
  smartEmptyHandling?: boolean;
  progressiveValidation?: boolean;
  debounceValidation?: boolean;
  contextAware?: boolean;
};

// React Native specific types
export type ReactNativeInputProps = {
  onChangeText?: (text: string) => void;
  onValueChange?: (value: any) => void;
  selected?: boolean;
  error?: string;
  setNativeProps?: (props: any) => void;
};

export type PlatformSpecificProps = {
  web?: Record<string, any>;
  reactNative?: ReactNativeInputProps;
};

export type CrossPlatformForgerProps<TFieldValues extends FieldValues = FieldValues> = 
  ForgerProps<TFieldValues> & PlatformSpecificProps;
