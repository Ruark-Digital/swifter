import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToastHandler } from "@/hooks/useToaster";
import { Forge, Forger, useForge } from "@/lib/forge";
import type { ApiResponseError } from "@/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import { businessDivisionApi } from "../api/businessDivisionApi";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";

const createDivisionSchema = yup.object().shape({
  name: yup.string().trim().required("Name is required"),
  location: yup.string().trim().required("Location is required"),
});

type CreateDivisionFormValues = yup.InferType<typeof createDivisionSchema>;

type Props = {
  trigger?: ReactNode;
  mode?: "create" | "edit";
  divisionId?: string;
  initialValues?: CreateDivisionFormValues;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const CreateDivisionDialog = ({
  trigger,
  mode = "create",
  divisionId,
  initialValues,
  open: controlledOpen,
  onOpenChange,
}: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const defaults = useMemo(
    () => initialValues ?? { name: "", location: "" },
    [initialValues]
  );

  const { control, reset } = useForge<CreateDivisionFormValues>({
    resolver: yupResolver(createDivisionSchema),
    defaultValues: defaults,
  });

  const { mutateAsync: createDivision, isPending } = useMutation<
    Awaited<ReturnType<typeof businessDivisionApi.createDivision>>,
    ApiResponseError,
    CreateDivisionFormValues
  >({
    mutationKey: ["businessDivisions", "create"],
    mutationFn: async (payload) => await businessDivisionApi.createDivision(payload),
    onSuccess: (res) => {
      toast.success("Success", res?.message ?? "Business division created successfully");
      queryClient.invalidateQueries({ queryKey: ["businessDivisions"] });
      reset({ name: "", location: "" });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Error", error);
    },
  });

  const { mutateAsync: updateDivision, isPending: isUpdating } = useMutation<
    Awaited<ReturnType<typeof businessDivisionApi.updateDivision>>,
    ApiResponseError,
    CreateDivisionFormValues
  >({
    mutationKey: ["businessDivisions", "update", divisionId],
    mutationFn: async (payload) => {
      return await businessDivisionApi.updateDivision(divisionId ?? "", payload);
    },
    onSuccess: (res) => {
      toast.success("Success", res?.message ?? "Business division updated successfully");
      queryClient.invalidateQueries({ queryKey: ["businessDivisions"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Error", error);
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(defaults);
  }, [defaults, open, reset]);

  const onSubmit = async (data: CreateDivisionFormValues) => {
    if (mode === "edit") {
      await updateDivision(data);
      return;
    }
    await createDivision(data);
  };

  const onCancel = () => {
    reset(defaults);
    setOpen(false);
  };

  const pending = isPending || isUpdating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className="sm:max-w-[520px]"
        data-testid={mode === "edit" ? "edit-division-dialog" : "create-division-dialog"}
      >
        <DialogHeader>
          <DialogTitle className="font-quicksand">
            {mode === "edit" ? "Edit Division" : "Create Division"}
          </DialogTitle>
        </DialogHeader>
        <Forge control={control} onSubmit={onSubmit} className="space-y-5">
          <Forger
            name="name"
            component={TextInput}
            label="Division Name"
            placeholder="Enter division name"
          />
          <Forger
            name="location"
            component={TextInput}
            label="Location"
            placeholder="Enter location"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2A4467] hover:bg-[#1f3552]" disabled={pending}>
              {mode === "edit" ? "Save Changes" : "Create Division"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDivisionDialog;
