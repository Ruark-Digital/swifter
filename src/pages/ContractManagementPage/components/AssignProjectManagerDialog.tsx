import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import { TextInput } from "@/components/layouts/FormInputs";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { contractManagerApi } from "../api/contractManagerApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AssignPmFormValues = { email: string };

const AssignProjectManagerDialog: React.FC<{
  contractId: string;
  hasExistingPm?: boolean;
  invalidateQueryKey: unknown[];
  trigger: React.ReactNode;
}> = ({ contractId, hasExistingPm, invalidateQueryKey, trigger }) => {
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<AssignPmFormValues>({
    defaultValues: { email: "" },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["onboard-project-manager", contractId],
    mutationFn: (email: string) =>
      contractManagerApi.onboardProjectManager(contractId, { email }),
    onSuccess: async () => {
      toastHandler.success(
        "Project Manager",
        "Project manager onboarded and assigned successfully",
      );
      await queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
      reset();
      setOpen(false);
    },
    onError: (error: ApiResponseError) => {
      if (error.response?.status === 409) {
        toastHandler.error(
          "Assign Project Manager",
          "This person is already a project manager for this vendor — select them from the list instead.",
        );
        return;
      }
      toastHandler.error("Assign Project Manager", error);
    },
  });

  const handleSubmit = async (data: AssignPmFormValues) => {
    const email = data.email?.trim() ?? "";
    if (!EMAIL_RE.test(email)) {
      toastHandler.error("Assign Project Manager", "Enter a valid email address");
      return;
    }
    await mutateAsync(email);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full max-w-lg gap-0 overflow-hidden rounded-2xl border-0 p-0">
        <Forge control={control} onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 pb-2 pt-6">
            <div className="text-lg font-semibold text-[#0F0F0F] dark:text-slate-100">
              {hasExistingPm ? "Change Project Manager" : "Assign Project Manager"}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Invite a new vendor project manager by email. They receive an
              onboarding invite and are assigned to this contract.
            </p>
          </div>

          <div className="space-y-4 px-6 pb-4 pt-2">
            <Forger
              name="email"
              label="Project Manager Email"
              placeholder="pm@example.com"
              component={TextInput}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] dark:border-slate-700 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-4"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-[#2A4467] px-4 text-white"
              disabled={isPending}
            >
              {isPending ? "Assigning..." : hasExistingPm ? "Change PM" : "Assign PM"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default AssignProjectManagerDialog;
