import { useState } from "react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { useForge, Forge, Forger } from "@/lib/forge";
import { TextFileUploader } from "@/components/layouts/FormInputs/TextFileInput";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import RichTextEditor from "@/components/layouts/FormInputs/RichTextEditor";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError, User } from "@/types";
import { FileListItem } from "./components/FileListITem";
import { useWatch } from "react-hook-form";
import { Upload } from "lucide-react";
import { TextMultiSelect } from "@/components/layouts/FormInputs";
import { Company } from "../CompaniesPage";

export interface AppCampaignPayload {
  subject: string;
  subtitle: string;
  message: string;
  bannerUrl: string;
  recipientType: string;
  timezone: string;
}

export interface EmailCampaignPayload {
  subject: string;
  message: string;
  recipientType: string;
  timezone: string;
}

const userTypeOptions = [
  { value: "all_users", label: "All Users" },
  { value: "company_users", label: "Company Users" },
  { value: "specific_users", label: "Specific Users" },
  { value: "vendors", label: "Vendors" },
  { value: "evaluators", label: "Evaluator" },
  { value: "procurement_lead", label: "Procurement Lead" },
];

const UploadElement = () => (
  <div className="text-center">
    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-4" />
    <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
      Drag & Drop or Click to choose file
    </p>
    <p className="text-xs text-gray-400">Supported formats: PNG, JPEG</p>
  </div>
);

export default function Communication() {
  // Ensure recipientType is always set to avoid validation errors
  const { control } = useForge<AppCampaignPayload | EmailCampaignPayload>({
    defaultValues: {
      recipientType: "all_users",
    } as any,
  });
  const [activeTab, setActiveTab] = useState("email");
  const { success: successToast, error: errorToast } = useToastHandler();

  const userType = useWatch({
    control,
    name: "recipientType",
  });

  const emailCampaignMutation = useMutation<
    ApiResponse,
    ApiResponseError,
    AppCampaignPayload
  >({
    mutationFn: async (data: any) =>
      await postRequest({ url: "/campaigns/email", payload: data }),
  });

  const appCampaignMutation = useMutation<
    ApiResponse,
    ApiResponseError,
    EmailCampaignPayload
  >({
    mutationFn: async (data: any) =>
      await postRequest({ url: "/campaigns/app", payload: data }),
    onSuccess: () => {
      successToast(
        "App Campaign Created",
        "The app campaign has been created successfully."
      );
    },
  });

  // Helper to ensure bannerUrl is a string; if a File[] was provided by the uploader, upload and extract URL
  const resolveBannerUrl = async (bannerValue: any): Promise<string | undefined> => {
    try {
      if (Array.isArray(bannerValue) && bannerValue.length > 0) {
        const formData = new FormData();
        formData.append("file", bannerValue[0]);
        const uploadRes = await postRequest({
          url: "/upload",
          payload: formData,
          config: { headers: { "Content-Type": "multipart/form-data" } },
        });
        const uploadedUrl: string | undefined = uploadRes?.data?.data?.[0]?.url;
        return uploadedUrl;
      }
      if (typeof bannerValue === "string") return bannerValue;
      return undefined;
    } catch (err) {
      errorToast("Banner Upload Failed", "Unable to upload banner file. Please try again.");
      throw err;
    }
  };

  const createEmailCampaign = async (data: any) => {
    try {
      const payload: any = { ...data };
      // Fallback recipientType when empty
      if (!payload.recipientType) payload.recipientType = "all_users";

      // Normalize bannerUrl to string as required by API
      if (payload.bannerUrl !== undefined) {
        const banner = await resolveBannerUrl(payload.bannerUrl);
        if (banner) payload.bannerUrl = banner;
        else delete payload.bannerUrl; // avoid sending an array/null
      }

      const res = await emailCampaignMutation.mutateAsync(payload);

      console.log(res);

      successToast(
        "Email Campaign Created",
        "The email campaign has been created successfully."
      );
    } catch (error) {
      errorToast(
        "Error",
        "An error occurred while creating the email campaign."
      );
    }
  };

  const createAppCampaign = async (data: any) => {
    try {
      const payload: any = { ...data };
      if (!payload.recipientType) payload.recipientType = "all_users";

      if (payload.bannerUrl !== undefined) {
        const banner = await resolveBannerUrl(payload.bannerUrl);
        if (banner) payload.bannerUrl = banner;
        else delete payload.bannerUrl;
      }

      await appCampaignMutation.mutateAsync(payload);
    } catch (error) {
      errorToast(
        "Error",
        "An error occurred while creating the app campaign."
      );
    }
  };

  const onSubmitHandler = {
    email: createEmailCampaign,
    sms: createEmailCampaign,
    push: createAppCampaign,
  };

  return (
    <div className="p-6 min-h-full dark:text-gray-200">
      <h4 className="text-2xl font-bold mb-10">Communication Management</h4>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger
            value="email"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            Email
          </TabsTrigger>
          <TabsTrigger
            value="sms"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            SMS
          </TabsTrigger>
          <TabsTrigger
            value="push"
            className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
          >
            In-App Notification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardContent>
              <h4 className="text-xl font-bold my-3">Create Email Campaign</h4>

              <Forge
                {...{
                  control,
                  className: "space-y-5 max-w-2xl",
                  onSubmit:
                    onSubmitHandler[activeTab as keyof typeof onSubmitHandler],
                }}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <p>Send to:</p>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg w-40">
                      <Forger
                        name="recipientType"
                        component="select"
                        className="w-full dark:bg-gray-700 dark:text-white"

                        children={userTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      />
                    </div>
                  </div>
                  {userType === "specific_users" && <ForgerUser />}
                  {userType === "company_users" && <ForgerCompany />}
                </div>

                <Forger
                  {...{ name: "subject", component: TextInput, label: "Title" }}
                />
                <Forger
                  {...{
                    name: "subtitle",
                    component: TextInput,
                    label: "Subtitle",
                  }}
                />
                <Forger
                  {...{
                    name: "bannerUrl",
                    className: "w-full border border-dashed mt-2",
                    component: TextFileUploader,
                    label: "Promotional Banner",
                    element: <UploadElement />,
                    List: FileListItem,
                  }}
                />
                <Forger
                  {...{
                    name: "message",
                    component: RichTextEditor,
                    placeholder: "Write your message here...",
                    label: "Message",
                  }}
                />

                <Button
                  type="submit"
                  isLoading={emailCampaignMutation.isPending}
                >
                  Send Message
                </Button>
              </Forge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="mt-6">
          <Card>
            <CardContent>
              <h4 className="text-xl font-bold my-3">Create SMS Campaign</h4>

              <Forge
                {...{
                  control,
                  className: "space-y-5 max-w-2xl",
                  onSubmit:
                    onSubmitHandler[activeTab as keyof typeof onSubmitHandler],
                }}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <p>Send to:</p>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg w-40">
                      <Forger
                        name="recipientType"
                        component="select"
                        className="w-full"
                        children={userTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      />
                    </div>
                  </div>
                  {userType === "specific_users" && <ForgerUser />}
                  {userType === "company_users" && <ForgerCompany />}
                </div>

                <Forger
                  {...{ name: "subject", component: TextInput, label: "Title" }}
                />
                <Forger
                  {...{
                    name: "subtitle",
                    component: TextInput,
                    label: "Subtitle",
                  }}
                />

                <Forger
                  {...{
                    name: "message",
                    component: RichTextEditor,
                    placeholder: "Write your message here...",
                    label: "Message",
                  }}
                />

                <Button
                  type="submit"
                  isLoading={emailCampaignMutation.isPending}
                >
                  Send Message
                </Button>
              </Forge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="mt-6">
          <Card>
            <CardContent>
              <h4 className="text-xl font-bold my-3">Create In-App Campaign</h4>

              <Forge
                {...{
                  control,
                  className: "space-y-5 max-w-2xl",
                  onSubmit:
                    onSubmitHandler[activeTab as keyof typeof onSubmitHandler],
                }}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <p>Send to:</p>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg w-40">
                      <Forger
                        name="recipientType"
                        component="select"
                        className="w-full dark:bg-gray-700 dark:text-white"
                        children={userTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      />
                    </div>
                  </div>
                  {userType === "specific_users" && <ForgerUser />}
                  {userType === "company_users" && <ForgerCompany />}
                </div>

                <Forger
                  {...{ name: "subject", component: TextInput, label: "Title" }}
                />
                <Forger
                  {...{
                    name: "subtitle",
                    component: TextInput,
                    label: "Subtitle",
                  }}
                />
                <Forger
                  {...{
                    name: "bannerUrl",
                    className: "w-full border border-dashed mt-2",
                    component: TextFileUploader,
                    label: "Promotional Banner",
                    element: <UploadElement />,
                    List: FileListItem,
                  }}
                />
                <Forger
                  {...{
                    name: "message",
                    component: RichTextEditor,
                    placeholder: "Write your message here...",
                    label: "Message",
                  }}
                />

                <Button
                  type="submit"
                  isLoading={appCampaignMutation.isPending}
                >
                  Send Message
                </Button>
              </Forge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type UserItem = User & { firstName: string };

type UsersListResponse = {
  data: UserItem[];
  total: number;
  page: number;
  limit: number;
};

const ForgerUser = () => {
  // Fetch users list
  const { data: usersData, isLoading } = useQuery<
    ApiResponse<UsersListResponse>,
    ApiResponseError
  >({
    queryKey: ["users"],
    queryFn: async () =>
      await getRequest({
        url: "/users",
        config: {
          params: {
            page: 1,
            limit: 10000000,
          },
        },
      }),
  });

  const userOptions =
    usersData?.data.data.data.map((item) => ({
      value: item._id,
      label: item.firstName,
    })) || [];

  return (
    <div className="flex items-center gap-3">
      <p>CC:</p>
      <div className="p-2 bg-gray-100 rounded-lg w-40">
        <Forger
          name="userId"
          placeholder={isLoading ? "Loading..." : "Select users"}
          component={TextMultiSelect}
          className="w-full focus:outline-none capitalize"
          options={userOptions}
          children={userOptions.map((item) => (
            <option key={item.value} className="capitalize" value={item.value}>
              {item.label}
            </option>
          ))}
        />
      </div>
    </div>
  );
};

type CompaniesListResponse = {
  total: number;
  page: number;
  limit: number;
  data: Company[];
};

const ForgerCompany = () => {
  const { data: companiesData, isLoading } = useQuery<
    ApiResponse<CompaniesListResponse>,
    ApiResponseError
  >({
    queryKey: ["companies"],
    queryFn: async () => {
      return await getRequest({
        url: "/companies",
        config: {
          params: {
            page: 1,
            limit: 100000000,
          },
        },
      });
    },
  });

  const userOptions =
    companiesData?.data.data.data.map((item) => ({
      value: item._id,
      label: item.name,
    })) || [];

  return (
    <div className="flex items-center gap-3">
      <p>CC:</p>
      <div className="p-2 bg-gray-100 rounded-lg w-40">
        <Forger
          name="companyId"
          placeholder={isLoading ? "Loading..." : "Select company"}
          component={TextMultiSelect}
          className="w-full focus:outline-none capitalize"
          options={userOptions}
        />
      </div>
    </div>
  );
};
