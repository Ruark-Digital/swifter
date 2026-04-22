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
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { useForge, Forger, Forge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { postRequest, getRequest } from "@/lib/axiosInstance";
import { ApiList, ApiResponse, ApiResponseError, SubscriptionPlan } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";

const schema = yup.object().shape({
  name: yup.string().required("Company name is required"),
  domain: yup.string().required("Company domain is required"),
  planName: yup.string().required("Subscription plan is required"),
  duration: yup.number().positive().integer().required("Subscription duration is required"),
  adminEmails: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        text: yup.string().email().required(),
      })
    )
    .min(1, "At least one admin is required")
    .max(3, "Maximum 3 admins allowed"),
});

type CreateCompanyData = yup.InferType<typeof schema>;

const CreateCompanyDialog = () => {
  const [open, setOpen] = useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<CreateCompanyData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      domain: "",
      planName: "",
      duration: 1,
      adminEmails: [],
    },
  });

  // Fetch subscription plans
  const { data: plansData, isLoading: plansLoading } = useQuery<ApiResponse<ApiList<SubscriptionPlan>>>({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      return await getRequest({ url: "/subscriptions/plans" });
    },
  });

  const { mutate: createCompany, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    CreateCompanyData
  >({
    mutationKey: ["createCompany"],
    mutationFn: async (data) => {
      // Transform data to match API expectations
      const transformedData = {
        name: data.name,
        domain: data.domain,
        planName: data.planName,
        duration: data.duration,
        adminEmails: data.adminEmails?.map(admin => admin.text), // Extract email addresses
      };
      return await postRequest({ url: "/onboarding/company", payload: transformedData });
    },
    onSuccess: () => {
      toast.success("Success", "Company created successfully");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companyDashboard"] });
      setOpen(false);
      reset();
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to create company"
      );
    },
  });

  const handleSubmit = async (data: CreateCompanyData) => {
    createCompany(data);
  };

  // Transform subscription plans data for select options
  const subscriptionOptions = plansData?.data?.data.data?.map?.(plan => ({
    label: `${plan.name}`,
    value: plan.name,
  })) || [];

  const subscriptionDurationOptions = [
    { label: "1 year", value: 1 },
    { label: "2 years", value: 2 },
    { label: "3 years", value: 3 },
    { label: "4 years", value: 4 },
    { label: "5 years", value: 5 },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Create New Company
        </Button>
      </DialogTrigger>
      <DialogContent className=" transition-colors duration-200">
        <DialogHeader className="flex flex-row items-center justify-between  pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Company
          </DialogTitle>
        </DialogHeader>

        <Forge control={control} onSubmit={handleSubmit} className="space-y-6">
          <Forger
            name="name"
            component={TextInput}
            label="Company Name"
            placeholder="AIG Pro"
          />

          <Forger
            name="domain"
            component={TextInput}
            label="Company Domain"
            placeholder="aigpro.com"
          />

          <Forger
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
          />

          <Forger
            name="adminEmails"
            component={TextTagInput}
            label="Assign Admins (Multi-Select)"
            // tags={adminTags}
            helperText="Add up to 3 admins. separate each emails with a comma or enter button"
          />

          <div className="flex justify-between pt-6  mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              // disabled={isPending}
              className="px-8 bg-[#2A4467] hover:bg-[#1e3252]"
            >
              {isPending ? "Sending Invite..." : "Send Invite"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompanyDialog;
