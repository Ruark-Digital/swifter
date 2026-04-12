 
import {
  Field,
  FieldElement,
  FieldPath,
  FieldRefs,
  FieldValues,
  FormState,
  InternalFieldName,
  Path,
  PathValue,
  ReadFormState,
  SetFieldValue,
  SetValueConfig,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import { ForgeControl, UseForgeResult } from "../types";
import {
  FieldConfig,
  ValidationStrategy
} from "../types/validationTypes";
import {
  createEnhancedValidationState,
  convertErrorsToFieldStates,
  createFieldConfig
} from "../utils/validationUtils";
import deepEqual, {
  cloneObject,
  set,
  get,
  isWatched,
  isNullOrUndefined,
  isDateObject,
  isFileInput,
  isCheckBoxInput,
  isHTMLElement,
  isMultipleSelect,
  unset,
  convertToArrayPayload,
  isEmptyObject,
  iterateFieldsByAction,
  VALIDATION_MODE,
  updateFieldArrayRootError,
} from "../utils";
import { isObject, isString, isUndefined } from "lodash";
import getDirtyFields from "../logic/getDirtyFields";
import getFieldValueAs from "../logic/getFieldValueAs";
import validateField from "../validateField";
import getResolverOptions from "../logic/getResolverOptions";
import hasPromiseValidation from "../logic/hasPromiseValidation";

export type UseForgeValuesProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  control: ForgeControl<TFieldValues>;
  methods?: UseForgeResult<TFieldValues>;
};

export type UseForgeValuesReturn<
  TFieldValues extends FieldValues = FieldValues
> = {
  setValue: <TFieldName extends Path<TFieldValues>>(
    name: TFieldName,
    value: PathValue<TFieldValues, TFieldName>,
    options?: {
      shouldValidate?: boolean;
      shouldDirty?: boolean;
      shouldTouch?: boolean;
    }
  ) => void;
  getValue: <TFieldName extends Path<TFieldValues>>(
    name: TFieldName
  ) => PathValue<TFieldValues, TFieldName>;
  getValues: () => TFieldValues;
};


export type Ref = FieldElement;

/**
 * A custom hook that provides setValue and getValue functions for ForgeControl
 * @param {UseForgeValuesProps} props - The props containing forgeControl and optional methods
 * @returns {UseForgeValuesReturn} - Object containing setValue and getValue functions
 */
export const useForgeValues = <TFieldValues extends FieldValues = FieldValues>({
  control,
  methods,
}: UseForgeValuesProps<TFieldValues>): UseForgeValuesReturn<TFieldValues> => {
  const _proxyFormState: ReadFormState = {
    isDirty: false,
    dirtyFields: false,
    validatingFields: false,
    touchedFields: false,
    isValidating: false,
    isValid: false,
    errors: false,
  };
  const _proxySubscribeFormState = {
    ..._proxyFormState,
  };

  const shouldDisplayAllAssociatedErrors =
    control._options.criteriaMode === VALIDATION_MODE.all;

  const _updateIsValidating = (names?: string[], isValidating?: boolean) => {
    if (
      !control._options.disabled &&
      (_proxyFormState.isValidating ||
        _proxyFormState.validatingFields ||
        _proxySubscribeFormState.isValidating ||
        _proxySubscribeFormState.validatingFields)
    ) {
      (names || Array.from(control._names.mount)).forEach((name) => {
        if (name) {
          isValidating
            ? set(control._formState.validatingFields, name, isValidating)
            : unset(control._formState.validatingFields, name);
        }
      });

      control._subjects.state.next({
        validatingFields: control._formState.validatingFields,
        isValidating: !isEmptyObject(control._formState.validatingFields),
      });
    }
  };

  const updateTouchAndDirty = (
    name: InternalFieldName,
    fieldValue: unknown,
    isBlurEvent?: boolean,
    shouldDirty?: boolean,
    shouldRender?: boolean
  ): Partial<
    Pick<FormState<TFieldValues>, "dirtyFields" | "isDirty" | "touchedFields">
  > => {
    let shouldUpdateField = false;
    let isPreviousDirty = false;
    const output: Partial<FormState<TFieldValues>> & { name: string } = {
      name,
    };

    if (!control._options.disabled) {
      if (!isBlurEvent || shouldDirty) {
        if (_proxyFormState.isDirty || _proxySubscribeFormState.isDirty) {
          isPreviousDirty = control._formState.isDirty;
          control._formState.isDirty = output.isDirty = control._getDirty();
          shouldUpdateField = isPreviousDirty !== output.isDirty;
        }

        const isCurrentFieldPristine = deepEqual(
          get(control._defaultValues, name),
          fieldValue
        );

        isPreviousDirty = !!get(control._formState.dirtyFields, name);
        isCurrentFieldPristine
          ? unset(control._formState.dirtyFields, name)
          : set(control._formState.dirtyFields, name, true);
        output.dirtyFields = control._formState.dirtyFields;
        shouldUpdateField =
          shouldUpdateField ||
          ((_proxyFormState.dirtyFields ||
            _proxySubscribeFormState.dirtyFields) &&
            isPreviousDirty !== !isCurrentFieldPristine);
      }

      if (isBlurEvent) {
        const isPreviousFieldTouched = get(
          control._formState.touchedFields,
          name
        );

        if (!isPreviousFieldTouched) {
          set(control._formState.touchedFields, name, isBlurEvent);
          output.touchedFields = control._formState.touchedFields;
          shouldUpdateField =
            shouldUpdateField ||
            ((_proxyFormState.touchedFields ||
              _proxySubscribeFormState.touchedFields) &&
              isPreviousFieldTouched !== isBlurEvent);
        }
      }

      shouldUpdateField && shouldRender && control._subjects.state.next(output);
    }

    return shouldUpdateField ? output : {};
  };

  const _setValid = async (shouldUpdateValid?: boolean, enhancedOptions?: {
    strategy?: ValidationStrategy;
    fieldConfigs?: FieldConfig<TFieldValues>[];
    useEnhancedValidation?: boolean;
  }) => {
    if (
      !control._options.disabled &&
      (_proxyFormState.isValid ||
        _proxySubscribeFormState.isValid ||
        shouldUpdateValid)
    ) {
      const isValid = control._options.resolver
        ? isEmptyObject((await _runSchema()).errors)
        : await executeBuiltInValidation(control._fields, true);

      // Enhanced validation logic
      if (enhancedOptions?.useEnhancedValidation) {
        const fieldConfigs = enhancedOptions.fieldConfigs || 
          Object.keys(control._fields).map(fieldName => 
            createFieldConfig(fieldName as Path<TFieldValues>)
          );

        const fieldStates = convertErrorsToFieldStates<TFieldValues>(
          control._formState.errors,
          fieldConfigs,
          getValues(),
          control._formState.touchedFields as Record<string, boolean>
        );

        const enhancedState = createEnhancedValidationState(fieldStates);
        
        // Store enhanced state on control for access by components
        (control as any)._enhancedValidationState = enhancedState;

        // Use progressive validation based on strategy
        const strategy = enhancedOptions.strategy || 'progressive';
        const finalIsValid = strategy === 'progressive' 
          ? enhancedState.isPartiallyValid 
          : (strategy === 'lenient' ? enhancedState.criticalFieldsValid : isValid);

        if (finalIsValid !== control._formState.isValid) {
          control._subjects.state.next({
            isValid: finalIsValid,
          });
        }
      } else {
        // Original validation logic
        if (isValid !== control._formState.isValid) {
          control._subjects.state.next({
            isValid,
          });
        }
      }
    }
  };

  const _focusInput = (ref: Ref, key: string) => {
    if (get(control._formState.errors, key) && ref.focus) {
      ref.focus();
      return 1;
    }
    return;
  };

  const getValues: UseFormGetValues<TFieldValues> = (
    fieldNames?:
      | FieldPath<TFieldValues>
      | ReadonlyArray<FieldPath<TFieldValues>>
  ) => {
    const values = {
      ...(control._state.mount ? control._formValues : control._defaultValues),
    };

    return isUndefined(fieldNames)
      ? values
      : isString(fieldNames)
      ? get(values, fieldNames)
      : fieldNames.map((name) => get(values, name));
  };

  const _runSchema = async (name?: InternalFieldName[]) => {
    _updateIsValidating(name, true);
    const result = await control._options.resolver!(
      control._formValues as TFieldValues,
      control._options.context,
      getResolverOptions(
        name || control._names.mount,
        control._fields,
        control._options.criteriaMode,
        control._options.shouldUseNativeValidation
      )
    );
    _updateIsValidating(name);
    return result;
  };

  const executeSchemaAndUpdateState = async (names?: InternalFieldName[]) => {
    const { errors } = await _runSchema(names);

    if (names) {
      for (const name of names) {
        const error = get(errors, name);
        error
          ? set(control._formState.errors, name, error)
          : unset(control._formState.errors, name);
      }
    } else {
      control._formState.errors = errors;
    }

    return errors;
  };

  const executeBuiltInValidation = async (
    fields: FieldRefs,
    shouldOnlyCheckValid?: boolean,
    context: {
      valid: boolean;
    } = {
      valid: true,
    }
  ) => {
    for (const name in fields) {
      const field = fields[name];

      if (field) {
        const { _f, ...fieldValue } = field as Field;

        if (_f) {
          const isFieldArrayRoot = control._names.array.has(_f.name);
          const isPromiseFunction =
            field._f && hasPromiseValidation((field as Field)._f);

          if (isPromiseFunction && _proxyFormState.validatingFields) {
            _updateIsValidating([name], true);
          }

          const fieldError = await validateField(
            field as Field,
            control._formValues,
            shouldDisplayAllAssociatedErrors,
            control._options.shouldUseNativeValidation && !shouldOnlyCheckValid,
            isFieldArrayRoot,
            control._names.disabled,
          );

          if (isPromiseFunction && _proxyFormState.validatingFields) {
            _updateIsValidating([name]);
          }

          if (fieldError[_f.name]) {
            context.valid = false;
            if (shouldOnlyCheckValid) {
              break;
            }
          }

          !shouldOnlyCheckValid &&
            (get(fieldError, _f.name)
              ? isFieldArrayRoot
                ? updateFieldArrayRootError(
                    control._formState.errors,
                    fieldError,
                    _f.name
                  )
                : set(control._formState.errors, _f.name, fieldError[_f.name])
              : unset(control._formState.errors, _f.name));
        }

        !isEmptyObject(fieldValue) &&
          (await executeBuiltInValidation(
            fieldValue,
            shouldOnlyCheckValid,
            context
          ));
      }
    }

    return context.valid;
  };

  const trigger: UseFormTrigger<TFieldValues> = async (name, options = {}) => {
    let isValid;
    let validationResult;
    const fieldNames = convertToArrayPayload(name) as InternalFieldName[];

    if (control._options.resolver) {
      const errors = await executeSchemaAndUpdateState(
        isUndefined(name) ? name : fieldNames
      );

      isValid = isEmptyObject(errors);
      validationResult = name
        ? !fieldNames.some((name) => get(errors, name))
        : isValid;
    } else if (name) {
      validationResult = (
        await Promise.all(
          fieldNames.map(async (fieldName) => {
            const field = get(control._fields, fieldName);
            return await executeBuiltInValidation(
              field && field._f ? { [fieldName]: field } : field
            );
          })
        )
      ).every(Boolean);
      !(!validationResult && !control._formState.isValid) && _setValid(true, {
        strategy: (control as any)._validationStrategy,
        fieldConfigs: (control as any)._fieldConfigs,
        useEnhancedValidation: (control as any)._useEnhancedValidation
      });
    } else {
      validationResult = isValid = await executeBuiltInValidation(
        control._fields
      );
    }

    control._subjects.state.next({
      ...(!isString(name) ||
      ((_proxyFormState.isValid || _proxySubscribeFormState.isValid) &&
        isValid !== control._formState.isValid)
        ? {}
        : { name }),
      ...(control._options.resolver || !name ? { isValid } : {}),
      errors: control._formState.errors,
    });

    options.shouldFocus &&
      !validationResult &&
      iterateFieldsByAction(
        control._fields,
        _focusInput,
        name ? fieldNames : control._names.mount
      );

    return validationResult;
  };

  const setFieldValue = (
    name: InternalFieldName,
    value: SetFieldValue<TFieldValues>,
    options: SetValueConfig = {}
  ) => {
    const field: Field = get(control._fields, name);
    let fieldValue: unknown = value;

    if (field) {
      const fieldReference = field._f;

      if (fieldReference) {
        !fieldReference.disabled &&
          set(
            control._formValues,
            name,
            getFieldValueAs(value, fieldReference)
          );

        fieldValue =
          isHTMLElement(fieldReference.ref) && isNullOrUndefined(value)
            ? ""
            : value;

        if (isMultipleSelect(fieldReference.ref)) {
          [...(fieldReference.ref as HTMLSelectElement).options].forEach(
            (optionRef) =>
              (optionRef.selected = (
                fieldValue as InternalFieldName[]
              ).includes(optionRef.value))
          );
        } else if (fieldReference.refs) {
          if (isCheckBoxInput(fieldReference.ref)) {
            fieldReference.refs.forEach((checkboxRef) => {
              if (!checkboxRef.defaultChecked || !checkboxRef.disabled) {
                if (Array.isArray(fieldValue)) {
                  checkboxRef.checked = !!fieldValue.find(
                    (data: string) => data === checkboxRef.value
                  );
                } else {
                  checkboxRef.checked =
                    fieldValue === checkboxRef.value || !!fieldValue;
                }
              }
            });
          } else {
            fieldReference.refs.forEach(
              (radioRef: HTMLInputElement) =>
                (radioRef.checked = radioRef.value === fieldValue)
            );
          }
        } else if (isFileInput(fieldReference.ref)) {
          fieldReference.ref.value = "";
        } else {
          fieldReference.ref.value = fieldValue;

          if (!fieldReference.ref.type) {
            control._subjects.state.next({
              name,
              values: cloneObject(control._formValues) as any,
            });
          }
        }
      }
    }

    (options.shouldDirty || options.shouldTouch) &&
      updateTouchAndDirty(
        name,
        fieldValue,
        options.shouldTouch,
        options.shouldDirty,
        true
      );

    options.shouldValidate && trigger(name as Path<TFieldValues>);
  };

  const setValues = <
    T extends InternalFieldName,
    K extends SetFieldValue<TFieldValues>,
    U extends SetValueConfig
  >(
    name: T,
    value: K,
    options: U
  ) => {
    for (const fieldKey in value) {
      if (!value.hasOwnProperty(fieldKey)) {
        return;
      }
      const fieldValue = value[fieldKey];
      const fieldName = name + "." + fieldKey;
      const field = get(control._fields, fieldName);

      (control._names.array.has(name) ||
        isObject(fieldValue) ||
        (field && !field._f)) &&
      !isDateObject(fieldValue)
        ? setValues(fieldName, fieldValue, options)
        : setFieldValue(fieldName, fieldValue, options);
    }
  };

  const setValue: UseFormSetValue<TFieldValues> = (
    name,
    value,
    options = {}
  ) => {
    const field = get(control._fields, name);
    const isFieldArray = control._names.array.has(name);
    const cloneValue = cloneObject(value);

    set(control._formValues, name, cloneValue);

    if (isFieldArray) {
      control._subjects.array.next({
        name,
        values: cloneObject(control._formValues),
      });

      if (
        (_proxyFormState.isDirty ||
          _proxyFormState.dirtyFields ||
          _proxySubscribeFormState.isDirty ||
          _proxySubscribeFormState.dirtyFields) &&
        options.shouldDirty
      ) {
        control._subjects.state.next({
          name,
          dirtyFields: getDirtyFields(
            control._defaultValues,
            control._formValues
          ) as any,
          isDirty: control._getDirty(name, cloneValue),
        });
      }
    } else {
      field && !field._f && !isNullOrUndefined(cloneValue)
        ? setValues(name, cloneValue, options)
        : setFieldValue(name, cloneValue, options);
    }

    isWatched(name, control._names) &&
      control._subjects.state.next({ ...control._formState });
    control._subjects.state.next({
      name: control._state.mount ? name : undefined,
      values: cloneObject(control._formValues) as any,
    });
  };

  const getValue = <TFieldName extends Path<TFieldValues>>(
    name: TFieldName
  ): PathValue<TFieldValues, TFieldName> => {
    // Use methods.getValues if available
    if (methods?.getValues) {
      return methods.getValues(name);
    }

    // Try to access getValues from control._formControl (react-hook-form internal)
    if (control && typeof control === "object") {
      // Check if control has _formControl property (from createFormControl)
      const formControl = (control as any)._formControl || control;
      if (formControl && typeof formControl.getValues === "function") {
        return formControl.getValues(name);
      }

      // Fallback: try direct access to getValues
      if (typeof (control as any).getValues === "function") {
        return (control as any).getValues(name);
      }
    }

    console.error("getValues method not found on control:", control);
    return undefined as any;
  };

  return {
    setValue,
    getValue,
    getValues
  };
};
