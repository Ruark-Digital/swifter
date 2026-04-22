import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge, Forger } from "@/lib/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categorySchema = yup.object({
  name: yup.string().required("Category name is required"),
});

type CategoryFormData = yup.InferType<typeof categorySchema>;

const CreateCategoryDialog: React.FC<CreateCategoryDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<CategoryFormData>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const { mutateAsync: createCategory, isPending } = useMutation<
    ApiResponse<{ _id: string; name: string }>,
    ApiResponseError,
    CategoryFormData
  >({
    mutationKey: ["createCategory"],
    mutationFn: async (data) =>
      await postRequest({ url: "/procurement/vendors/category", payload: data }),
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const response = await createCategory(data);

      if (response?.data) {
        toast.success(
          "Category Created",
          "Your category has been created successfully."
        );
        
        // Invalidate and refetch vendor categories
        queryClient.invalidateQueries({ queryKey: ["solicitationCategories"] });
        
        // Close dialog and reset form
        onOpenChange(false);
        reset();
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Creation Failed",
        err?.message ?? "Failed to create category. Please try again."
      );
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            Create New Category
          </DialogTitle>
        </DialogHeader>

        <Forge control={control} onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            <Forger
              component={TextInput}
              name="name"
              label="Category Name"
              placeholder="Enter category name"
              containerClass="space-y-2"
            />
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg"
            >
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryDialog;