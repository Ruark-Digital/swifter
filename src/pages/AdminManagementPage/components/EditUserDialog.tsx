import React, { useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { useForge, Forge, Forger, FormPropsRef } from "@adexdsamson/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { putRequest, getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { Option } from "@/components/ui/multiselect";
import { RoleComboField } from "@/components/layouts/RoleComboField";
import { buildRoleOptions, optionsFromUserRoles } from "@/lib/roleCombos";
import * as yup from "yup";

const schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  middleName: yup.string(),
  roles: yup
    .array()
    .min(1, "Select at least one role")
    .max(2, "You can select up to two roles"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

type FormValues = yup.InferType<typeof schema>;

type AdminUpdatePayload = {
  name: string;
  email: string;
  roles: string[];
};

interface EditUserDialogProps {
  admin: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role: { _id: string; name: string };
    roles?: (string | { _id?: string; id?: string; name?: string })[];
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

  const { control, reset } = useForge<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName,
      lastName,
      roles: [],
      email: admin?.email || "",
    },
  });

  // Roles catalog for the multi-select (label = name, value = document id).
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await getRequest({ url: "/onboarding/roles" }),
    enabled: open,
  });
  const roleOptions = buildRoleOptions(rolesData?.data?.data || []);

  // Hydrate the multi-select from the admin's existing role(s) once the catalog
  // is available (needed to resolve ids/names into options).
  useEffect(() => {
    if (!open || !admin || roleOptions.length === 0) return;
    reset({
      firstName,
      lastName,
      roles: optionsFromUserRoles(admin.roles, admin.role, roleOptions),
      email: admin.email || "",
    });
    // roleOptions identity changes each render; gate on its length + admin id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, admin?._id, rolesData]);

  const updateMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    AdminUpdatePayload
  >({
    mutationFn: (payload: AdminUpdatePayload) =>
      putRequest({
        url: `/users/${admin?._id || admin?.id}`,
        payload,
      }),
    onSuccess: (result, variables) => {
      toast.success(
        "Update User",
        result.data.message ?? "User updated successfully"
      );
      if (onUserUpdate && admin) {
        onUserUpdate(admin._id || admin.id!, {
          name: variables.name,
          email: variables.email,
          roles: variables.roles,
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
      const selectedRoles = (data.roles ?? []) as Option[];
      await updateMutation.mutateAsync({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        roles: selectedRoles.map((option) => option.value),
      });
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
            control={control}
            onSubmit={handleSubmit}
            ref={formRef}
            className="space-y-6"
          >
            <Forger
              name="firstName"
              component={TextInput}
              label="First Name"
              placeholder="Enter Admin Name"
              containerClass="space-y-1"
            />
            <Forger
              name="lastName"
              component={TextInput}
              label="Last Name"
              placeholder="Enter Admin Name"
              containerClass="space-y-1"
            />
            <RoleComboField control={control} options={roleOptions} />
            <Forger
              name="email"
              component={TextInput}
              label="Email Address"
              placeholder="Enter email address"
              type="email"
              disabled
              containerClass="space-y-1"
            />
          </Forge>
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
