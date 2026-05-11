import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { useForge, Forge, FormPropsRef } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";

const schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  middleName: yup.string(),
  role: yup.string().required("Role is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

type FormValues = yup.InferType<typeof schema>;

interface EditUserDialogProps {
  admin: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role: { _id: string; name: string };
    companyId?: string;
    company?: string;
    lastLoginAt?: string;
    lastLogin?: string;
    status: "pending" | "active" | "inactive" | "suspended";
    userId?: string;
    dateCreated?: string;
    createdAt: string;
    updatedAt: string;
    userActivity?: {
      numberOfUsersCreated: number;
    };
  } | null;
  children: React.ReactNode;
  onUserUpdate?: (adminId: string, updatedData: any) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  admin,
  children,
  onUserUpdate,
}) => {
  const [open, setOpen] = React.useState(false);
  const formRef = useRef<FormPropsRef | null>(null);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  // Parse the admin name into first and last name
  const nameParts = admin?.name?.split(" ") || ["", ""];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const { control } = useForge<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName,
      lastName,

      role: admin?.role.name || "",
      email: admin?.email || "",
    },
    fields: [
      {
        name: "firstName",
        component: TextInput,
        label: "First Name",
        placeholder: "Enter Admin Name",
      },
      {
        name: "lastName",
        component: TextInput,
        label: "Last Name",
        placeholder: "Enter Admin Name",
      },
      {
        name: "role",
        component: TextSelect,
        label: "Role",
        placeholder: "Procurement Lead/Evaluators",
        options: [
          { label: "Company Admin", value: "company_admin" },
          { label: "Super Admin", value: "super_admin" },
          { label: "Procurement Lead", value: "procurement_lead" },
          { label: "Evaluator", value: "evaluator" },
        ],
      },
      {
        name: "email",
        component: TextInput,
        label: "Email Address",
        placeholder: "Enter Vendor Name",
        type: "email",
        disabled: true,
      },
    ],
  });

  const updateMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    FormValues
  >({
    mutationFn: (userData: FormValues) =>
      putRequest({
        url: `/users/${admin?._id || admin?.id}`,
        payload: {
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          role: userData.role,
        },
      }),
    onSuccess: (result, variables) => {
      toast.success(
        "Update User",
        result.data.message ?? "User updated successfully"
      );
      if (onUserUpdate && admin) {
        onUserUpdate(admin._id || admin.id!, {
          name: `${variables.firstName} ${variables.lastName}`.trim(),
          email: variables.email,
          role: variables.role,
        });
      }
      // Invalidate dashboard count query to refresh statistics
      queryClient.invalidateQueries({ queryKey: ["dashboard-count"] });
      // Invalidate admins list query to refresh the table data
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Update User", error);
    },
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!admin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Edit User
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-6">
          <Forge
            {...{
              control,
              onSubmit: handleSubmit,
              ref: formRef,
              className: "space-y-6",
            }}
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => formRef.current?.onSubmit()}
              disabled={updateMutation.isPending}
              className="text-white"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
