import React, { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRequest, putRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError, User, UserRole } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { Button } from "@/components/ui/button";
import { useUser, useSetUser } from "@/store/authSlice";
import { useToastHandler } from "@/hooks/useToaster";
import { useState } from "react";
import AvatarUploader from "./AvatarUploader";
import { PageLoader } from "@/components/ui/PageLoader";

export interface UploadFileResponse {
  size: string;
  type: string;
  url: string;
  name: string;
}
interface Vendor {
  _id:            string;
  vendorId:       string;
  secondaryEmail: string[];
  documents:      any[];
  businessType:   string;
  location:       string;
  companyName: string;
  website?: string;
  category: string;
}

// Listed exhaustively (and type-checked against UserRole) so adding a role to
// the union surfaces here as a decision instead of silently hiding every
// profile field for it — the QA #280 failure mode.
const EVERY_INTERNAL_ROLE: UserRole[] = [
  "super_admin",
  "company_admin",
  "procurement",
  "contract_manager",
  "evaluator",
  "approver",
  "project_manager",
  "view_only",
];

const EVERY_ROLE: UserRole[] = [...EVERY_INTERNAL_ROLE, "vendor"];

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  department?: string;
  companyName?: string;
  website?: string;
  businessType?: string;
  location: string;
  category: string;
  name: string
}


const ProfileInformation: React.FC = () => {
  const user = useUser();
  const setUser = useSetUser();
  const toast = useToastHandler();
  // Resolve via useUserRole rather than reading `user.role.name` directly: the
  // raw value may be a populated object, a name slug or a bare id, and
  // multi-role users carry `roles[]` with no legacy `role` at all — in those
  // cases the direct read yields undefined and every field below is hidden.
  const { userRole } = useUserRole();
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);

  // Query to fetch user data
  const {
    data: userData,
    isLoading,
    refetch,
    isSuccess
  } = useQuery<ApiResponse<{ user: User, vendor: Vendor }>, ApiResponseError>({
    queryKey: ["getUserProfile", user?._id],
    queryFn: async () => await getRequest({ url: "/users/me" }),
    retryOnMount: true
  });

  // Mutation to update user profile
  const { mutateAsync: updateProfile, isPending } = useMutation<
    ApiResponse<{ user: User }>,
    ApiResponseError,
    Partial<User>
  >({
    mutationKey: ["updateUser"],
    mutationFn: async (userData) =>
      await putRequest({ url: "/users", payload: userData }),
    onSuccess: (response) => {
      toast.success("Success", "Profile updated successfully");
      // Merge — don't replace — the auth store user. The PUT /users response
      // returns a trimmed user object that omits `module` (and can reshape
      // `role`/`roles`). The sidebar/navigation is built from `user.module`
      // plus the resolved role, so replacing the whole user wiped `module`,
      // every module-gated nav item failed its `isModuleEnabled` gate, and the
      // menu collapsed to just Profile. Preserve those nav-critical fields.
      const updated = response.data?.data?.user;
      if (updated) {
        setUser({
          ...user,
          ...updated,
          module: updated.module ?? user?.module,
          role: updated.role ?? user?.role,
          roles: updated.roles ?? user?.roles,
        } as User);
      }
      refetch();
    },
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to update profile"
      );
    },
  });

  // Mutation to upload files
  const { mutateAsync: uploadFile } = useMutation<
    ApiResponse<UploadFileResponse[]>,
    ApiResponseError,
    FormData
  >({
    mutationKey: ["uploadFile"],
    mutationFn: async (formData) =>
      await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      }),
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to upload file"
      );
    },
  });

  // Field visibility configuration based on roles. Keyed by the `UserRole`
  // slug so it matches what useUserRole resolves — the previous
  // space-separated labels ("company admin") silently matched nothing once the
  // slug form was used.
  //
  // A role absent from a list gets that field hidden, so a role missing from
  // ALL of them renders an empty form (QA #280 — this happened to
  // contract_manager, project_manager, approver and view_only). Everyone must
  // be able to edit their own personal details, so the personal fields below
  // are keyed off EVERY_ROLE / EVERY_INTERNAL_ROLE rather than hand-listed;
  // only genuinely role-specific fields carry a short explicit list.
  const fieldVisibility: Record<string, UserRole[]> = {
    // firstName: [],
    // lastName: [],
    // middleName: [],
    email: EVERY_ROLE,
    role: EVERY_ROLE,
    phoneNumber: EVERY_ROLE,
    name: EVERY_ROLE,
    // Vendors have no internal department; company admins never had this field.
    department: EVERY_INTERNAL_ROLE.filter((r) => r !== "company_admin"),
    companyName: ["company_admin"],
    website: ["company_admin", "vendor"],
    businessType: ["vendor"],
    location: ["vendor"],
    category: ["company_admin", "vendor"],
  };

  // Helper function to check if field should be visible
  const isFieldVisible = (fieldName: keyof typeof fieldVisibility) => {
    return fieldVisibility[fieldName].includes(userRole);
  };

  const { control, setValue } = useForge<FormValues>({});

  useEffect(() => {
    if(isSuccess) {
      const _user = userData?.data?.data?.user;
      const _vendor = userData?.data?.data?.vendor;
      
      // `/users/me` returns `role` as a populated object for some accounts and
      // a bare slug string for others (e.g. view_only → "view_only"), so
      // reading `.name` unconditionally left the Role field blank. Fall back to
      // the role useUserRole already resolved.
      const rawRole = _user?.role as unknown;
      const resolvedRole =
        typeof rawRole === "string"
          ? rawRole
          : (rawRole as { name?: string } | undefined)?.name;

      const payload = {
        firstName: _user?.name,
        email: _user?.email,
        role: resolvedRole ?? userRole,
        phone: _user?.phone,
        department: _user?.department,
        companyName: _vendor?.companyName || _user?.companyId?.name,
        website: _vendor?.website,
        businessType: _vendor?.businessType,
        location: _vendor?.location,
        category: _vendor?.category,
        name: _user?.name 
      }
      
      Object.entries(payload).forEach(([key, value]) => {
        setValue(key as keyof FormValues, value)
      })
    }

  }, [isSuccess, userRole])

  const handleSubmit = async (data: any) => {
    try {
      // Role and email are rendered disabled — they exist to inform, not to
      // edit. Now that the Role field carries a real value for slug-shaped
      // roles, drop both from the update so saving a profile can never submit
      // a role change.
      const { role: _omitRole, email: _omitEmail, ...editable } = data ?? {};
      data = editable;
      // Validate website URL if provided
      // if (data.website && data.website.trim() && !data.website.startsWith('https://')) {
      //   toast.error("Error", "Website URL must start with https://");
      //   return;
      // }
      
      // Handle avatar upload if there are selected files
      if (selectedFiles && selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("file", selectedFiles[0]);
        
        const uploadResponse = await uploadFile(formData);
        const fileUrl = uploadResponse.data?.data?.[0]?.url;
        
        if (fileUrl) {
          data.avatar = fileUrl;
          setSelectedFiles(null);
        } else {
          toast.error("Error", "Failed to get file URL from upload response");
          return;
        }
      }
      
      await updateProfile(data);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };



  const handleAvatarUpdate = async (avatarUrl: string | null) => {
    try {
      await updateProfile({ avatar: avatarUrl || undefined });
      if (!avatarUrl) {
        toast.success("Success", "Avatar removed successfully");
      }
    } catch (error) {
      console.error("Avatar update error:", error);
    }
  };

  if (isLoading) {
    return (
      <PageLoader 
        title="Profile Information" 
        message="Loading profile..."
        showHeader={false}
        className="p-6"
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-6 mb-8">
        {/* Profile Avatar */}
        <AvatarUploader
          currentImage={user?.avatar}
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
          fallbackText={(userData?.data?.data?.user?.name || user?.name || "U")
            .charAt(0)
            .toUpperCase()}
          size="large"
        />

        {/* Profile Header */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {userData?.data?.data?.user?.name || user?.name || ""}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Update your photo and personal details.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() => handleAvatarUpdate(null)}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <Forge {...{ control, onSubmit: handleSubmit }} className="space-y-6">
        {/* First Name */}
        {/* {isFieldVisible("firstName") && (
          <Forger
            component={TextInput}
            name="firstName"
            label="First Name"
            defaultValue={userData?.data?.data?.user?.name || user?.name || ""}
            containerClass="space-y-2"
          />
        )} */}

        {/* Middle Name */}
        {/* {isFieldVisible("middleName") && (
          <Forger
            component={TextInput}
            name="middleName"
            label="Middle Name"
            containerClass="space-y-2"
          />
        )} */}

        {/* Last Name */}
        {/* {isFieldVisible("lastName") && (
          <Forger
            component={TextInput}
            name="lastName"
            label="Last Name"
            containerClass="space-y-2"
          />
        )} */}

        {/* Company Name - Vendor only */}
        {isFieldVisible("companyName") && (
          <Forger
            component={TextInput}
            name="companyName"
            label="Company Name"
            containerClass="space-y-2"
          />
        )}

        {/* Name - Company Admin only */}
        {isFieldVisible("name") && (
          <Forger
            component={TextInput}
            name="name"
            label="Name"
            containerClass="space-y-2"
          />
        )}

        {isFieldVisible("businessType") && (
          <Forger
            component={TextInput}
            name="businessType"
            label="Business Type"
            containerClass="space-y-2"
          />
        )}

        {isFieldVisible("website") && (
          <Forger
            component={TextInput}
            name="website"
            label="Website"
            placeholder="https://example.com"
            helperText="Please include https:// at the beginning of your website URL"
            containerClass="space-y-2"
          />
        )}

        {/* Location - Vendor only */}
        {isFieldVisible("location") && (
          <Forger
            component={TextInput}
            name="location"
            label="Location"
            containerClass="space-y-2"
          />
        )}

        {/* Email and Phone Row */}
        <div className="grid grid-cols-2 gap-6">
          {isFieldVisible("email") && (
            <Forger
              component={TextInput}
              name="email"
              disabled
              label="Email Address"
              containerClass="space-y-2"
            />
          )}
          {isFieldVisible("phoneNumber") && (
            <Forger
              component={TextInput}
              name="phone"
              label="Phone Number"
              containerClass="space-y-2"
            />
          )}
        </div>

        {/* Role and Department Row */}
        <div className="grid grid-cols-2 gap-6">
          {isFieldVisible("role") && (
            <Forger
              component={TextInput}
              name="role"
              label="Role"
              disabled
              containerClass="space-y-2"
            />
          )}
          {isFieldVisible("department") && (
            <Forger
              component={TextInput}
              name="department"
              label="Department"
              containerClass="space-y-2"
            />
          )}

          {isFieldVisible("category") && (
            <Forger
              component={TextInput}
              name="category"
              label="Category"
              containerClass="space-y-2"
            />
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isPending} isLoading={isPending} className="px-6">
            Save Changes
          </Button>
        </div>
      </Forge>
    </div>
  );
};

export default ProfileInformation;
