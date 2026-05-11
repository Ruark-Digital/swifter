import { isString, isUndefined } from "lodash";
import { Field, NativeFieldValue } from "react-hook-form";

export default <T extends NativeFieldValue>(
  value: T,
  { valueAsNumber, valueAsDate, setValueAs }: Field['_f'],
) =>
  isUndefined(value)
    ? value
    : valueAsNumber
      ? value === ''
        ? NaN
        : value
          ? +value
          : value
      : valueAsDate && isString(value)
        ? new Date(value)
        : setValueAs
          ? setValueAs(value)
          : value;