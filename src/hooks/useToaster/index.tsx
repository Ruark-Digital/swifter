import { useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ApiResponseError } from "@/types";

export const useToastHandler = () => {
  const { toast } = useToast();

  // `toast` is a module-level stable reference, so memoizing these handlers
  // keeps the returned object identity stable across renders. Without this,
  // consumers that call `toast.error/success` inside an effect that lists the
  // handler in its dependency array (e.g. SavingsDetailsSheet, HoldbackDetailsSheet)
  // re-run the effect every render → setState → re-render → infinite loop
  // ("Maximum update depth exceeded").
  const onErrorHandler = useCallback(
    (title: string, error?: ApiResponseError | string) => {
      if (!error) {
        toast({
          title,
          variant: "destructive",
        });
        return;
      }

      if (typeof error === "string") {
        toast({
          title,
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (error?.response?.data && error.response?.data.message) {
        toast({
          title,
          description: error.response?.data?.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title,
        description: "Unknown error occurred",
        variant: "destructive",
      });
    },
    [toast],
  );

  const onSuccessHandler = useCallback(
    (title: string, message: string) => {
      toast({ title, description: message ?? "success", variant: "default" });
    },
    [toast],
  );

  return useMemo(
    () => ({ success: onSuccessHandler, error: onErrorHandler }),
    [onSuccessHandler, onErrorHandler],
  );
};
