import React, { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRequest, putRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError, User } from "@/types";
import { Forge, Forger, useForge } from "@/lib/forge";
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
  const userRole = user?.role?.name?.toLowerCase()?.replace("_", " ");
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
      // Update the auth store with the new user data
      if (response.data?.data?.user) {
        setUser(response.data.data.user);
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

  // Field visibility configuration based on roles
  const fieldVisibility = {
    // firstName: [],
    // lastName: [],
    // middleName: [],
    email: [
      "super admin",
      "vendor",
      "evaluator",
      "procurement",
      "company admin",
    ],
    role: ["super admin", "company admin", "evaluator", "procurement", "vendor"],
    phoneNumber: ["super admin", "company admin", "vendor", "procurement", 
      "evaluator",],
    department: ["super admin", "evaluator", "procurement"],
    companyName: ["company admin"],
    name: ["company admin", "procurement", "super admin", "evaluator", "vendor"],
    website: ["company admin", "vendor"],
    businessType: ["vendor"],
    location: ["vendor"],
    category: ["company admin", "vendor"],
  };

  // Helper function to check if field should be visible
  const isFieldVisible = (fieldName: keyof typeof fieldVisibility) => {
    return fieldVisibility[fieldName].includes(userRole || "");
  };

  const { control, setValue } = useForge<FormValues>({});

  useEffect(() => {
    if(isSuccess) {
      const _user = userData?.data?.data?.user;
      const _vendor = userData?.data?.data?.vendor;
      
      const payload = {
        firstName: _user?.name,
        email: _user?.email,
        role: _user?.role.name,
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

  }, [isSuccess])

  const handleSubmit = async (data: any) => {
    try {
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
