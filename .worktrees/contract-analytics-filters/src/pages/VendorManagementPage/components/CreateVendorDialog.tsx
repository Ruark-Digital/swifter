import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CloudUpload, X } from "lucide-react";
import { Forge, useForge, Forger } from "@/lib/forge";
import {
  TextInput,
  TextTagInput,
} from "@/components/layouts/FormInputs/TextInput";
import { TextSelectWithSearch } from "@/components/layouts/FormInputs/TextSelectWithSearch";
import * as yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest, getAxiosInstance } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useFileUpload } from "@/hooks/use-file-upload";
import { yupResolver } from "@hookform/resolvers/yup";

// Types
type VendorCategory = {
  _id?: string;
  name: string;
};

type CreateCategoryPayload = {
  name: string;
};

type CreateCategoryResponse = {
  _id: string;
  name: string;
};

type CreateVendorPayload = {
  name: string;
  categoryId: string;
  primaryEmail: string;
  vendorId: string;
  secondaryEmails?: string[];
};

type CreateVendorResponse = {
  vendorId: string;
  name: string;
  businessType?: string;
  website?: string;
  status: string;
  isSuspended: boolean;
  location?: string;
  secondaryEmail?: string;
  user: {
    _id: string;
    email: string;
    name: string;
    status: string;
  };
};

// Form validation schema
const vendorSchema = yup.object({
  name: yup.string().required("Vendor name is required"),
  categoryId: yup.string().required("Category is required"),
  primaryEmail: yup
    .string()
    .email("Valid email is required")
    .required("Primary email is required"),
  secondaryEmails: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        text: yup.string().email("Valid email is required").required(),
      })
    )
    .optional(),
  vendorId: yup.string().required("Vendor ID is required"),
});

type VendorFormData = yup.InferType<typeof vendorSchema>;

interface CreateVendorDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CreateVendorDialog: React.FC<CreateVendorDialogProps> = ({
  open: controlledOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const toast = useToastHandler();

  // Fetch vendor categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<
    ApiResponse<VendorCategory[]>,
    ApiResponseError
  >({
    queryKey: ["vendorCategories"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/vendors/category" }),
  });

  const categoryOptions =
    categoriesData?.data.data?.map((category) => ({
      label: category.name,
      value: category._id || category.name, // Use ID if available, fallback to name
    })) || [];

  // Create vendor mutation
  const { mutateAsync: createVendor, isPending: isCreating } = useMutation<
    ApiResponse<CreateVendorResponse>,
    ApiResponseError,
    CreateVendorPayload
  >({
    mutationKey: ["createVendor"],
    mutationFn: async (vendorData) =>
      await postRequest({ url: "/procurement/vendors", payload: vendorData }),
    onSuccess: () => {
      // Invalidate vendor-related queries to trigger automatic refetch
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendorDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["vendorCategories"] });
      // Also invalidate solicitation-related queries that might include vendor data
      queryClient.invalidateQueries({ queryKey: ["solicitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
    },
  });

  // Create category mutation
  const { mutateAsync: createCategory } = useMutation<
    ApiResponse<CreateCategoryResponse>,
    ApiResponseError,
    CreateCategoryPayload
  >({
    mutationKey: ["createCategory"],
    mutationFn: async (categoryData) =>
      await postRequest({ url: "/procurement/vendors/category", payload: categoryData }),
    onSuccess: () => {
      // Invalidate categories query to trigger automatic refetch
      queryClient.invalidateQueries({ queryKey: ["vendorCategories"] });
    },
  });

  // Create multiple vendors mutation
  const { mutateAsync: createMultipleVendors, isPending: isCreatingMultiple } = useMutation<
    ApiResponse<CreateVendorResponse[]>,
    ApiResponseError,
    FormData
  >({
    mutationKey: ["createMultipleVendors"],
    mutationFn: async (formData) => {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post("/procurement/vendors/creat-many", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate vendor-related queries to trigger automatic refetch
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendorDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["vendorCategories"] });
      // Also invalidate solicitation-related queries that might include vendor data
      queryClient.invalidateQueries({ queryKey: ["solicitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
    },
  });

  // Form instance
  const forge = useForge<VendorFormData>({
    resolver: yupResolver(vendorSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      primaryEmail: "",
      secondaryEmails: [],
    },
  });

  // File upload for multiple vendors
  const [fileUploadState, fileUploadActions] = useFileUpload({
    maxFiles: 1,
    accept: ".xls,.xlsx,.csv",
    multiple: false,
    onFilesChange: () => {
      // Handle file changes if needed
    },
  });

  const handleCreateCategory = async (categoryName: string) => {
    try {
      const response = await createCategory({ name: categoryName });
      const newCategory = response.data.data;
      
      // Set the newly created category as selected
      forge.setValue("categoryId", newCategory._id);
      
      toast.success("Success", `Category "${categoryName}" created successfully`);
    } catch (error) {
      console.error("Error creating category:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message || "Failed to create category"
      );
    }
  };

  const onSubmit = async (data: VendorFormData) => {
    try {
      // Transform form data to API payload
      const payload: CreateVendorPayload = {
        name: data.name,
        categoryId: data.categoryId,
        primaryEmail: data.primaryEmail,
        secondaryEmails:
          data.secondaryEmails?.map((contact) => contact.text) || [],
        vendorId: data.vendorId,
      };

      await createVendor(payload);

      toast.success("Success", "Vendor created successfully");
      handleCancel();
    } catch (error) {
      console.error("Error creating vendor:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message || "Failed to create vendor"
      );
    }
  };

  const onSubmitMultipleVendors = async () => {
    try {
      if (fileUploadState.files.length === 0) {
        toast.error("Error", "Please select a file to upload");
        return;
      }

      const file = fileUploadState.files[0].file;
      if (!(file instanceof File)) {
        toast.error("Error", "Invalid file selected");
        return;
      }

      const formData = new FormData();
      formData.append("doc", file);

      await createMultipleVendors(formData);

      toast.success("Success", "Vendors created successfully");
      handleCancel();
    } catch (error) {
      console.error("Error creating multiple vendors:", error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message || "Failed to create vendors"
      );
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setActiveTab("single");
    forge.reset();
    fileUploadActions.clearFiles();
  };

  const renderSingleVendorForm = () => (
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
        name="categoryId"
        component={TextSelectWithSearch}
        options={categoryOptions}
        label="Category"
        placeholder={
          categoriesLoading ? "Loading categories..." : "Select a category"
        }
        searchPlaceholder="Search categories..."
        emptyMessage="No categories found"
        dependencies={[categoriesLoading]}
        onCreateNew={handleCreateCategory}
        createNewLabel="Create new category"
        showCreateNew={true}
        containerClass="space-y-2"
        disabled={categoriesLoading}
      />

      {/* Primary Email */}
      <Forger
        component={TextInput}
        name="primaryEmail"
        label="Primary Email"
        placeholder="Enter Primary Email"
        containerClass="space-y-2"
      />

      {/* Secondary Emails */}
      <Forger
        component={TextTagInput}
        name="secondaryEmails"
        label="Secondary emails for solicitation purposes."
        containerClass="space-y-2"
      />

      {/* Vendor ID */}
      <Forger
        component={TextInput}
        name="vendorId"
        label="Vendor ID"
        placeholder="Enter ID"
        containerClass="space-y-2"
      />
    </div>
  );

  const renderMultipleVendorsForm = () => (
    <div className="p-6 space-y-6">
      {/* Upload Documents */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Upload Documents
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            fileUploadState.isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={fileUploadActions.handleDragEnter}
          onDragLeave={fileUploadActions.handleDragLeave}
          onDragOver={fileUploadActions.handleDragOver}
          onDrop={fileUploadActions.handleDrop}
          onClick={fileUploadActions.openFileDialog}
        >
          <input {...fileUploadActions.getInputProps()} className="hidden" />
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <CloudUpload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drag & Drop or Click to choose file
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: XLS, XLSX, CSV
              </p>
            </div>
          </div>
        </div>
        
        {/* Display uploaded files */}
        {fileUploadState.files.length > 0 && (
          <div className="space-y-2">
            {fileUploadState.files.map((fileWithPreview) => (
              <div
                key={fileWithPreview.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <CloudUpload className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileWithPreview.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileWithPreview.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileUploadActions.removeFile(fileWithPreview.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Display errors */}
        {fileUploadState.errors.length > 0 && (
          <div className="space-y-1">
            {fileUploadState.errors.map((error, index) => (
              <p key={index} className="text-xs text-red-600">
                {error}
              </p>
            ))}
          </div>
        )}
        
        <p className="text-xs text-gray-600">
          Uploaded Document must contain company name, email addresses, vendor
          ID, office addresses and categories of each vendors
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#2A4467] hover:bg-[#1e3147] text-white px-6 py-2 rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Custom Header with Close Button */}
        <div className="flex items-center justify-between p-6">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            Add Vendor
          </DialogTitle>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-800 bg-transparent p-0 w-full justify-start">
              <TabsTrigger
                value="single"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Single Vendor
              </TabsTrigger>
              <TabsTrigger
                value="multiple"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Multiple Vendors
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Form Content */}
          <Forge control={forge.control} onSubmit={onSubmit}>
            <TabsContent value="single" className="mt-0">
              {renderSingleVendorForm()}
            </TabsContent>

            <TabsContent value="multiple" className="mt-0">
              {renderMultipleVendorsForm()}
            </TabsContent>

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
              {activeTab === "single" ? (
                <Button
                  type="submit"
                  disabled={isCreating || categoriesLoading}
                  className="px-8 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Send Invite"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onSubmitMultipleVendors}
                  disabled={isCreatingMultiple || fileUploadState.files.length === 0}
                  className="px-8 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingMultiple ? "Creating..." : "Send Invitation"}
                </Button>
              )}
            </div>
          </Forge>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVendorDialog;
