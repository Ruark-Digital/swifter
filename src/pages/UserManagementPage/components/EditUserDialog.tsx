import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { putRequest, getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForge, Forge, Forger, FormPropsRef } from "@adexdsamson/forge";
import * as yup from "yup";
import { PageLoader } from "@/components/ui/PageLoader";
import { Option } from "@/components/ui/multiselect";
import { RoleComboField } from "@/components/layouts/RoleComboField";
import { buildRoleOptions, optionsFromUserRoles } from "@/lib/roleCombos";

// Validation schema for editing user
const editUserSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  phone: yup.string(),
  department: yup.string(),
  roles: yup
    .array()
    .min(1, "Select at least one role")
    .max(2, "You can select up to two roles"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

type EditUserFormValues = yup.InferType<typeof editUserSchema>;

type EditUserPayload = {
  name: string;
  phone?: string;
  department?: string;
  email: string;
  roles: string[];
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: string | { _id: string; name: string };
  roles?: (string | { _id?: string; id?: string; name?: string })[];
  phone?: string;
  department?: string;
};

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const EditUserDialog = ({
  open,
  onOpenChange,
  userId,
}: EditUserDialogProps) => {
  const formRef = useRef<FormPropsRef | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: userData, isLoading } = useQuery<
    ApiResponse<{ user: User }>,
    ApiResponseError
  >({
    queryKey: ["user", userId],
    queryFn: async () => await getRequest({ url: `/users/${userId}` }),
    enabled: open && !!userId,
  });

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await getRequest({ url: "/onboarding/roles" }),
  });

  const user = userData?.data?.data?.user;
  const roles = rolesData?.data?.data || [];

  // Form setup
  const { control, reset } = useForge<EditUserFormValues>({
    resolver: yupResolver(editUserSchema),
    defaultValues: {
      name: "",
      phone: "",
      department: "",
      roles: [],
      email: "",
    },
  });

  // Assignable roles from the catalog, minus platform/vendor-assigned roles
  // (super_admin, project_manager, vendor, legacy "approval") — see roleCombos.
  const roleOptions = buildRoleOptions(roles);

  // Guard the form hydration so opening the dialog does not repeatedly reset it.
  useEffect(() => {
    if (!open) {
      hydratedUserIdRef.current = null;
      return;
    }

    if (!user || hydratedUserIdRef.current === user._id) {
      return;
    }

    // Need the catalog to resolve role ids/names into multi-select options.
    if (rolesLoading) {
      return;
    }

    reset({
      name: user.name || "",
      phone: user.phone || "",
      department: user.department || "",
      roles: optionsFromUserRoles(user.roles, user.role, roleOptions),
      email: user.email || "",
    });

    hydratedUserIdRef.current = user._id;
  }, [open, user, roleOptions, rolesLoading, reset]);

  const { mutateAsync: updateUser, isPending } = useMutation<
    ApiResponse<User>,
    ApiResponseError,
    EditUserPayload
  >({
    mutationKey: ["updateUser", userId],
    mutationFn: async (userData) =>
      await putRequest({ url: `/users/${userId}`, payload: userData }),
    onSuccess: () => {
      toast.success("Success", "User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      handleCancel();
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to update user",
      );
    },
  });

  const handleSubmit = async (data: EditUserFormValues) => {
    try {
      const selectedRoles = (data.roles ?? []) as Option[];
      await updateUser({
        name: data.name,
        phone: data.phone,
        department: data.department,
        email: data.email,
        roles: selectedRoles.map((option) => option.value),
      });
    } catch (error) {
      // Error is handled by onError
    }
  };

  const handleCancel = () => {
    hydratedUserIdRef.current = null;
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 sm:max-w-lg">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Edit User</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {isLoading || rolesLoading ? (
            <PageLoader
              showHeader={false}
              message="Loading user data..."
              className="py-8"
            />
          ) : (
            <Forge
              control={control}
              onSubmit={handleSubmit}
              className="space-y-5"
              ref={formRef}
            >
              <Forger
                name="name"
                component={TextInput}
                label="Full Name *"
                placeholder="Enter full name"
                containerClass="space-y-1"
              />

              <Forger
                name="phone"
                component={TextInput}
                label="Phone Number"
                placeholder="Enter phone number"
                containerClass="space-y-1"
              />

              <Forger
                name="department"
                component={TextInput}
                label="Department"
                placeholder="Enter department"
                containerClass="space-y-1"
              />

              <RoleComboField control={control} options={roleOptions} />

              <Forger
                name="email"
                component={TextInput}
                label="Email Address *"
                disabled
                containerClass="space-y-1"
              />
            </Forge>
          )}
        </div>

        <div className="p-6 flex items-center justify-end gap-3">
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
            onClick={() => formRef.current?.onSubmit()}
            disabled={isPending || isLoading}
            className="px-6 py-2 bg-[#2A4467] hover:bg-[#1e3147] text-white rounded-md"
          >
            {isPending ? "Updating..." : "Update User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
