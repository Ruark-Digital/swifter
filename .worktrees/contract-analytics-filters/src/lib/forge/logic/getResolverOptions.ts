import { CriteriaMode, Field, FieldName, FieldRefs, FieldValues, InternalFieldName } from "react-hook-form";
import { get, set } from "../utils";

export default <TFieldValues extends FieldValues>(
  fieldsNames: Set<InternalFieldName> | InternalFieldName[],
  _fields: FieldRefs,
  criteriaMode?: CriteriaMode,
  shouldUseNativeValidation?: boolean | undefined,
) => {
  const fields: Record<InternalFieldName, Field['_f']> = {};

  for (const name of fieldsNames) {
    const field: Field = get(_fields, name);

    field && set(fields, name, field._f);
  }

  return {
    criteriaMode,
    names: [...fieldsNames] as FieldName<TFieldValues>[],
    fields,
    shouldUseNativeValidation,
  };
};