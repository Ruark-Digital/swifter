import { FieldError, FieldErrors, FieldValues, InternalFieldName } from "react-hook-form";
import { convertToArrayPayload, get, set } from "../utils";

export default <T extends FieldValues = FieldValues>(
  errors: FieldErrors<T>,
  error: Partial<Record<string, FieldError>>,
  name: InternalFieldName,
): FieldErrors<T> => {
  const fieldArrayErrors = convertToArrayPayload(get(errors, name));
  set(fieldArrayErrors, 'root', error[name]);
  set(errors, name, fieldArrayErrors);
  return errors;
};