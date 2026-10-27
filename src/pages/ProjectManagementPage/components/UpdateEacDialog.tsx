import React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TextCurrencyInput } from "@/components/layouts/FormInputs";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/Spinner";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { useUpdateProjectEac } from "../hooks/useProjectApi";

type UpdateEacFormValues = {
  eac: string;
};

const schema = yup.object({
  eac: yup
    .string()
    .required("EAC is required")
    .test("is-positive-number", "Enter a valid amount", (value) => {
      const n = Number(value);
      return Number.isFinite(n) && n >= 0;
    }),
});

type UpdateEacDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  /** Current EAC value (pre-fills the input when already set). */
  currentEac?: number | null;
};

const UpdateEacDialog: React.FC<UpdateEacDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  currentEac,
}) => {
  const toast = useToastHandler();
  const mutation = useUpdateProjectEac(projectId);

  const { control, reset } = useForge<UpdateEacFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      eac: typeof currentEac === "number" ? String(currentEac) : "",
    },
  });

  // Re-seed the field whenever the dialog opens for a project whose EAC has
  // since changed (the form is created once, so defaultValues won't refresh).
  React.useEffect(() => {
    if (open) {
      reset({ eac: typeof currentEac === "number" ? String(currentEac) : "" });
    }
  }, [open, currentEac, reset]);

  const onSubmit = async (data: UpdateEacFormValues) => {
    try {
      const result = await mutation.mutateAsync({ eac: Number(data.eac) });
      toast.success(
        "EAC",
        result?.data?.message ?? "EAC updated successfully",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error("EAC", error as ApiResponseError);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update EAC</DialogTitle>
          <DialogDescription>
            Enter the Estimated At Completion value for this project.
          </DialogDescription>
        </DialogHeader>

        <Forge control={control} onSubmit={onSubmit} className="flex flex-col gap-6">
          <Forger
            name="eac"
            label="EAC"
            component={TextCurrencyInput}
            placeholder="Enter amount"
          />

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4 text-white" />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateEacDialog;
