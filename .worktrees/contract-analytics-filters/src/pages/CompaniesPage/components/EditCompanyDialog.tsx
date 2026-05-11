import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TextInput,
  TextTagInput,
} from "@/components/layouts/FormInputs/TextInput";
// import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { useForge, Forger, Forge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "@/lib/axiosInstance";
import {
  // ApiList,
  ApiResponse,
  ApiResponseError,
  // SubscriptionPlan,
} from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";

const schema = yup.object().shape({
  name: yup.string().required("Company name is required"),
  // planName: yup.string().required("Subscription plan is required"),
  duration: yup
    .number()
    .positive()
    .integer()
    .required("Subscription duration is required"),
  adminEmails: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        text: yup.string().email().required(),
      })
    ).optional(),
});

type EditCompanyData = yup.InferType<typeof schema>;

type Admin = { name: string; email: string; _id: string };

type Company = {
  _id: string;
  name: string;
  industry?: string;
  sizeCategory: string;
  status: "active" | "inactive" | "suspended";
  maxUsers: number;
  admins: Admin[];
  domain?: string;
  planName?: string;
  duration?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

interface EditCompanyDialogProps {
  company: Company;
  children: React.ReactNode;
  externalDialog?: boolean;
}

const EditCompanyDialog = ({
  company,
  children,
  externalDialog,
}: EditCompanyDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, setValue } = useForge<EditCompanyData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      // planName: "",
      // duration: 1,
      adminEmails: [],
    },
  });

  // // Fetch subscription plans
  // const { data: plansData, isLoading: plansLoading } = useQuery<
  //   ApiResponse<ApiList<SubscriptionPlan>>
  // >({
  //   queryKey: ["subscriptionPlans"],
  //   queryFn: async () => {
  //     return await getRequest({ url: "/subscriptions/plans" });
  //   },
  // });

  // Set form values when dialog opens
  useEffect(() => {
    if (isOpen && company) {
      setValue("name", company.name || "");
      // setValue("planName", company.planName || "");
      // setValue("duration", company.duration || 1);

      // Transform admin emails to the expected format
      const adminEmailTags =
        company.admins?.map((admin, index) => ({
          id: admin._id || index.toString(),
          text: admin.email,
        })) || [];
      setValue("adminEmails", adminEmailTags);
    }
  }, [isOpen, company, setValue]);

  const { mutate: updateCompany, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    EditCompanyData
  >({
    mutationKey: ["updateCompany", company._id],
    mutationFn: async (data) => {
      // Transform data to match API expectations
      const transformedData = {
        name: data.name,
        // planName: data.planName,
        // duration: data.duration,
        adminEmails: data.adminEmails?.map((admin) => admin.text), // Extract email addresses
      };
      return await putRequest({
        url: `/companies/${company._id}`,
        payload: transformedData,
      });
    },
    onSuccess: () => {
      toast.success("Success", "Company updated successfully");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companyDashboard"] });
      setIsOpen(false);
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to update company"
      );
    },
  });

  const handleSubmit = async (data: EditCompanyData) => {
    updateCompany(data);
  };

  // Transform subscription plans data for select options
  // const subscriptionOptions =
  //   plansData?.data?.data.data?.map?.((plan) => ({
  //     label: `${plan.name}`,
  //     value: plan.name,
  //   })) || [];

  // const subscriptionDurationOptions = [
  //   { label: "1 year", value: 1 },
  //   { label: "2 years", value: 2 },
  //   { label: "3 years", value: 3 },
  //   { label: "4 years", value: 4 },
  //   { label: "5 years", value: 5 },
  // ];

  const dialogContent = (
    <>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="transition-colors duration-200 max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Company
          </DialogTitle>
        </DialogHeader>

        <Forge control={control} onSubmit={handleSubmit} className="space-y-6">
          <Forger
            name="name"
            component={TextInput}
            label="Company Name"
            placeholder="AIG Pro"
          />

          {/* <Forger
            name="planName"
            component={TextSelect}
            label="Subscription Plan"
            placeholder={plansLoading ? "Loading plans..." : "Select Plan"}
            options={subscriptionOptions}
            disabled={plansLoading}
          />

          <Forger
            name="duration"
            component={TextSelect}
            label="Subscription Duration"
            placeholder="Select Duration"
            options={subscriptionDurationOptions}
          /> */}

          <Forger
            name="adminEmails"
            component={TextTagInput}
            label="Assign Admins (Multi-Select)"
          />

          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-200">
            Add up to 3 admins.
          </div>

          <div className="flex justify-between pt-6 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="px-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-8 bg-[#2A4467] hover:bg-[#1e3252]"
            >
              {isPending ? "Updating..." : "Update Company"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </>
  );

  if (externalDialog) {
    return dialogContent
  }

  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
    {dialogContent}
  </Dialog>;
};

export default EditCompanyDialog;
