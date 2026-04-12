 
import React from "react";
import { useSubscribe } from "../useSubscribe";
import { Control, FieldValues, EventType } from "react-hook-form";

type ForgePersist<TFieldValues extends FieldValues = FieldValues> = {
  control: Control<TFieldValues>;
  handler: (
    payload: FieldValues,
    formState: {
      name?: string | undefined;
      type?: EventType | undefined;
      values: FieldValues;
    }
  ) => void;
};

export const usePersist = <TFieldProps extends FieldValues = FieldValues>({
  control,
  handler,
}: ForgePersist<TFieldProps>) => {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  useSubscribe({
    disabled: false,
    subject: (control as any)._subjects.state,
    next: (formState) => {
      handlerRef.current((formState as any).values, (formState as any));
    },
  });
};
