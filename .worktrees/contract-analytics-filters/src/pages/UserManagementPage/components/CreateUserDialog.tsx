import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CloudUpload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForge, Forge, Forger, FormPropsRef } from "@/lib/forge";
import * as yup from "yup";
import { useUser } from "@/store/authSlice";

// Validation schemas
const singleUserSchema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  role: yup.string().required("Role is required"),
});

const multipleUserSchema = yup.object().shape({
  role: yup.string().required("Role is required"),
});

type SingleUserFormValues = yup.InferType<typeof singleUserSchema>;
type MultipleUserFormValues = yup.InferType<typeof multipleUserSchema>;

const CreateUserDialog = () => {
  const user = useUser()
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("single"); // Default to 'multiple' as per image
  const [file, setFile] = useState<File | null>(null);

  const singleUserFormRef = useRef<FormPropsRef | null>(null);
  const multipleUserFormRef = useRef<FormPropsRef | null>(null);

  const toast = useToastHandler();
  const queryClient = useQueryClient();

  // Single user form setup
  const { control: singleUserControl, reset: resetSingleUserForm } =
    useForge<SingleUserFormValues>({
      resolver: yupResolver(singleUserSchema),
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        role: "",
      },
    });

  // Multiple user form setup
  const { control: multipleUserControl, reset: resetMultipleUserForm } =
    useForge<MultipleUserFormValues>({
      resolver: yupResolver(multipleUserSchema),
      defaultValues: {
        role: "",
      },
    });

  const { mutateAsync: createUser, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    SingleUserFormValues & { companyId: string }
  >({
    mutationKey: ["createUser"],
    mutationFn: async (userData) =>
      await postRequest({ url: "/onboarding/add-user", payload: userData }),
    onSuccess: () => {
      toast.success("Success", "User invitation sent successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCancel();
    },
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to send user invitation"
      );
    },
  });

  const handleSingleUserSubmit = async (data: SingleUserFormValues) => {
    try {
      await createUser({...data, companyId: user?.companyId as any  ?? "" });
    } catch (error) {
      // Error is handled by onError
    }
  };

  const handleMultipleUsersSubmit = async () => {
    if (!file) {
      toast.error("Error", "Please upload a file for multiple users.");
      return;
    }

    try {
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('doc', file);

      // Call the bulk user creation API
      const response = await postRequest({
        url: "/onboarding/add-many-user",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });

      if (response.data) {
        toast.success(
          "Success",
          "Multiple users have been successfully created and invited."
        );
        handleCancel();
        // Refresh the user list
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    } catch (error) {
      console.error("Bulk user creation error:", error);
      const err = error as any;
      toast.error(
        "Upload Failed",
        err?.response?.data?.message ?? "Failed to create multiple users"
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    resetSingleUserForm();
    resetMultipleUserForm();
    setFile(null);
    setActiveTab("multiple");
  };

  const roleOptions = [
    { value: "company_admin", label: "Company Admin" },
    { value: "procurement", label: "Procurement Lead" },
    { value: "evaluator", label: "Evaluator" },
    { value: "contract_manager", label: "Contract Manager" },
    { value: "view_only", label: "View Only" },
    { value: "approver", label: "Approver" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-[#2A4467] hover:bg-[#1e3147] text-white">
          <Plus size={16} />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 sm:max-w-lg">
        {" "}
        {/* Adjusted width and padding */}
        <DialogHeader className="p-6 pb-0">
          {" "}
          {/* Added padding to header */}
          <DialogTitle className="text-xl">Add User</DialogTitle>{" "}
          {/* Matched title from image */}
          {/* DialogDescription removed as per new UI */}
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-0">
            {/* Padding for TabsList */}
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-800 bg-transparent p-0 w-full justify-start">
              <TabsTrigger
                value="single"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Single User
              </TabsTrigger>
              <TabsTrigger
                value="multiple"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Multiple Users
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="single" className="p-6 space-y-4 mt-0">
            <Forge
              control={singleUserControl}
              onSubmit={handleSingleUserSubmit}
              className="space-y-5"
              ref={singleUserFormRef}
            >
              <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-4">
                <Forger
                  name="firstName"
                  component={TextInput}
                  label="First Name *"
                  placeholder="Enter first name"
                  containerClass="space-y-1"
                />
                <Forger
                  name="middleName"
                  component={TextInput}
                  label="Middle Name *"
                  placeholder="Enter Middle name"
                  containerClass="space-y-1"
                />
              </div>

              <Forger
                name="lastName"
                component={TextInput}
                label="Last Name *"
                placeholder="Enter last name"
                containerClass="space-y-1"
              />

              <Forger
                name="role"
                component={TextSelect}
                label="Role *"
                placeholder="Select role"
                options={roleOptions}
                containerClass="space-y-1"
              />

              <Forger
                name="email"
                component={TextInput}
                label="Email Address *"
                placeholder="Enter email address"
                type="email"
                containerClass="space-y-1"
              />

              <Forger
                name="employeeId"
                component={TextInput}
                label="Employee ID"
                placeholder="Enter ID"
                type="email"
                containerClass="space-y-1"
              />
            </Forge>
          </TabsContent>

          <TabsContent value="multiple" className="p-6 space-y-6 mt-0">
            <Forge
              control={multipleUserControl}
              onSubmit={handleMultipleUsersSubmit}
              ref={multipleUserFormRef}
            >
              <Forger
                name="role"
                component={TextSelect}
                label="Role"
                placeholder="Procurement Lead/Evaluators"
                options={roleOptions}
                containerClass="space-y-1"
              />
            </Forge>

            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                onClick={() => document.getElementById("fileUpload")?.click()}
              >
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx,.csv"
                />
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <CloudUpload className="h-6 w-6 text-[#2A4467]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drag & Drop or{" "}
                      <span className="text-[#2A4467] font-semibold">
                        Click to choose file
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: XLS, XLSX, CSV
                    </p>
                    {file && (
                      <p className="text-xs text-green-600 mt-1">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Uploaded Document must contain name, email addresses
              </p>
            </div>
          </TabsContent>

          <div className="p-6 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="px-6 py-2 rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("onClick", singleUserFormRef)
                if (activeTab === "single") {
                  singleUserFormRef.current?.onSubmit();
                } else {
                  multipleUserFormRef.current?.onSubmit();
                }
              }}
              disabled={isPending}
              isLoading={isPending}
              className="px-6 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-md"
            >
              Send Invite
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
