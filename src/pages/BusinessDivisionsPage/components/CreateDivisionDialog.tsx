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
import { ReactNode, useState } from "react";
import * as yup from "yup";
import { businessDivisionApi } from "../api/businessDivisionApi";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";

const createDivisionSchema = yup.object().shape({
  name: yup.string().trim().required("Name is required"),
  location: yup.string().trim().required("Location is required"),
});

type CreateDivisionFormValues = yup.InferType<typeof createDivisionSchema>;

type Props = {
  trigger: ReactNode;
};

const CreateDivisionDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<CreateDivisionFormValues>({
    resolver: yupResolver(createDivisionSchema),
    defaultValues: { name: "", location: "" },
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

  const onSubmit = async (data: CreateDivisionFormValues) => {
    await createDivision(data);
  };

  const onCancel = () => {
    reset({ name: "", location: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-quicksand">Create Division</DialogTitle>
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2A4467] hover:bg-[#1f3552]" disabled={isPending}>
              Create Division
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDivisionDialog;

