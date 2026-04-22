import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRequest, putRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { Forge, Forger, useForge } from "@/lib/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { Button } from "@/components/ui/button";
import { useUser } from "@/store/authSlice";
import { useToastHandler } from "@/hooks/useToaster";
import AvatarUploader from "./AvatarUploader";
import { PageLoader } from "@/components/ui/PageLoader";

export interface UploadFileResponse {
  size: string;
  type: string;
  url: string;
  name: string;
}

interface CompanyData {
  name: string;
  email: string;
  contact: string;
  phone: string;
  businessType: string;
  location: string;
  website: string;
  logo?: string;
  companyId: {
    _id: string;
    name: string
  }
}

type FormValues = {
  name: string;
  email: string;
  contact: string;
  phone: string;
  businessType: string;
  location: string;
  website: string;
}

const CompanyProfile: React.FC = () => {
  const user = useUser();
  const toast = useToastHandler();
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);

  // Query to fetch company data
  const {
    data: companyData,
    isLoading,
    refetch,
    isSuccess
  } = useQuery<ApiResponse<{ user: CompanyData}>, ApiResponseError>({
    queryKey: ["getCompanyProfile"],
    queryFn: async () => await getRequest({ url: "/users/me" }),
    enabled: !!user?._id,
    retryOnMount: true
  });

  // Mutation to update company profile
  const { mutateAsync: updateCompanyProfile, isPending } = useMutation<
    ApiResponse<{ user: any }>,
    ApiResponseError,
    Partial<CompanyData>
  >({
    mutationKey: ["updateCompanyProfile"],
    mutationFn: async (companyData) =>
      await putRequest({ url: "/users/company", payload: companyData }),
    onSuccess: () => {
      toast.success("Success", "Company profile updated successfully");
      refetch();
    },
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to update company profile"
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

  const { control, setValue } = useForge<FormValues>({});

  useEffect(() => {
    if(isSuccess) {
      const _companyData = companyData?.data?.data?.user;
      
      const payload = {
        name: _companyData?.companyId?.name || user?.name || "",
        email: _companyData?.email || user?.email || "",
        contact: _companyData?.contact || user?.name || "",
        phone: _companyData?.phone || user?.phone || "",
        businessType: _companyData?.businessType || user?.businessType || "",
        location: _companyData?.location || user?.location || "",
        website: _companyData?.website || user?.website || "",
      }
      
      Object.entries(payload).forEach(([key, value]) => {
        setValue(key as keyof FormValues, value)
      })
    }
  }, [isSuccess, setValue]);

  const handleSubmit = async (data: any) => {
    try {
      // Handle logo upload if there are selected files
      if (selectedFiles && selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("file", selectedFiles[0]);
        
        const uploadResponse = await uploadFile(formData);
        const fileUrl = uploadResponse.data?.data?.[0]?.url;
        
        if (fileUrl) {
          data.logo = fileUrl;
          setSelectedFiles(null);
        } else {
          toast.error("Error", "Failed to get file URL from upload response");
          return;
        }
      }
      
      await updateCompanyProfile(data);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  const handleLogoDelete = async () => {
    try {
      await updateCompanyProfile({ logo: undefined });
      toast.success("Success", "Company logo removed successfully");
    } catch (error) {
      console.error("Logo delete error:", error);
    }
  };

  if (isLoading) {
    return (
      <PageLoader 
        title="Company Profile"
        message="Loading company profile..."
        showHeader={false}
        className="p-6"
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-6 mb-8">
        {/* Company Logo */}
        <AvatarUploader
          currentImage={companyData?.data?.data?.user?.logo || user?.logo}
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
          fallbackText={companyData?.data?.data?.user?.companyId?.name?.charAt(0) || "C"}
        />

        {/* Company Header */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {companyData?.data?.data?.user?.companyId?.name || "Company Name"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Update your logo and Company details.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={handleLogoDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <Forge {...{ control, onSubmit: handleSubmit }} className="space-y-6">
        {/* Company Name */}
        <Forger
          component={TextInput}
          name="name"
          label="Company Name"
          placeholder=""
          containerClass="space-y-2"
        />

        {/* Email Address */}
        <Forger
          component={TextInput}
          name="email"
          label="Email Address"
          placeholder=""
          containerClass="space-y-2"
        />

        {/* Contact */}
        <Forger
          component={TextInput}
          name="contact"
          label="Contact"
          placeholder=""
          containerClass="space-y-2"
        />

        {/* Phone Number */}
        <Forger
          component={TextInput}
          name="phone"
          label="Phone Number"
          placeholder=""
          containerClass="space-y-2"
        />

        {/* Business Type */}
        <Forger
          component={TextInput}
          name="businessType"
          label="Business Type"
          placeholder=""
          containerClass="space-y-2"
        />

        {/* Address */}
        <Forger
          component={TextInput}
          name="location"
          label="Address"
          placeholder=""
          containerClass="space-y-2"
        />

        {/* Website */}
        <Forger
          component={TextInput}
          name="website"
          label="Website"
          placeholder=""
          containerClass="space-y-2"
        />

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

export default CompanyProfile;