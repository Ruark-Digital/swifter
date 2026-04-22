import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge, Forger } from "@/lib/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextTagInput } from "@/components/layouts/FormInputs/TextInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";

import { ApiResponse, ApiResponseError } from "@/types";

type UpdateVendorPayload = {
  name?: string;
  website?: string;
  location?: string;
  secondaryEmails?: string[];
  phone?: string;
  businessType?: string;
};

type UpdateVendorResponse = {
  vendorId: string;
  name: string;
  website?: string;
  location?: string;
  secondaryEmails?: string[];
  phone?: string;
  businessType?: string;
}

// Form validation schema
const editVendorSchema = yup.object({
  name: yup.string().required("Vendor name is required"),
  website: yup.string().url("Valid website URL is required").optional(),
  location: yup.string().optional(),
  phone: yup.string().optional(),
  businessType: yup.string().optional(),
  secondaryEmails: yup
    .array()
    .of(
      yup.object({
        text: yup.string().email("Valid email is required"),
      })
    )
    .default([]),
});

type EditVendorFormData = yup.InferType<typeof editVendorSchema>;

interface EditVendorDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  vendorId?: string;
  vendorData?: {
    name: string;
    website?: string;
    location?: string;
    phone?: string;
    businessType?: string;
    secondaryEmails?: string[];
  };
}

const EditVendorDialog: React.FC<EditVendorDialogProps> = ({
  open: controlledOpen,
  onOpenChange,
  trigger,
  vendorId,
  vendorData,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // Update vendor mutation
  const { mutateAsync: updateVendor, isPending: isUpdating } = useMutation<
    ApiResponse<UpdateVendorResponse>,
    ApiResponseError,
    UpdateVendorPayload
  >({
    mutationKey: ["updateVendor", vendorId],
    mutationFn: async (payload) =>
      await putRequest({ url: `/procurement/vendors/${vendorId}`, payload }),
    onSuccess: () => {
      toast.success("Success", "Vendor updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendorDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", vendorId] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error updating vendor:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message || "Failed to update vendor"
      );
    },
  });

  // Form instance with pre-filled data
  const forge = useForge<EditVendorFormData>({
    defaultValues: {
      name: vendorData?.name || "",
      website: vendorData?.website || "",
      location: vendorData?.location || "",
      phone: vendorData?.phone || "",
      businessType: vendorData?.businessType || "",
      secondaryEmails: vendorData?.secondaryEmails?.map(email => ({ text: email })) || [],
    },
  });

  const onSubmit = async (data: EditVendorFormData) => {
    // Transform form data to API payload
    const payload: UpdateVendorPayload = {
      name: data.name,
      website: data.website,
      location: data.location,
      phone: data.phone,
      businessType: data.businessType,
      secondaryEmails:
        data.secondaryEmails?.map((contact) => contact.text ?? "") || [],
    };

    await updateVendor(payload);
  };

  const handleCancel = () => {
    setOpen(false);
    forge.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md p-0">
        {/* Custom Header with Close Button */}
        <div className="flex items-center justify-between p-6 ">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            Edit Vendor
          </DialogTitle>
          
        </div>

        {/* Form Content */}
        <Forge control={forge.control} onSubmit={onSubmit}>
          <div className="p-6 space-y-6">
            {/* Vendor Name */}
            <Forger
              component={TextInput}
              name="name"
              label="Vendor Name"
              placeholder="Enter Vendor Name"
              containerClass="space-y-2"
            />

            {/* Category */}
            <Forger
              component={TextInput}
              name="phone"
              label="Phone Number"
              placeholder="Enter Phone Number"
              containerClass="space-y-2"
            />

            {/* Business Type */}
            <Forger
              component={TextInput}
              name="businessType"
              label="Business Type"
              placeholder="Enter Business Type"
              containerClass="space-y-2"
            />

            {/* Secondary Emails */}
            <Forger
              component={TextTagInput}
              name="secondaryEmails"
              label="Secondary emails for solicitation purposes."
              containerClass="space-y-2"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between p-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="px-8 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default EditVendorDialog;