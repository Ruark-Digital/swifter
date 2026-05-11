import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { useForge, Forge, Forger, FormPropsRef } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { putRequest, getRequest } from "@/lib/axiosInstance";
import { ApiList, ApiResponse, ApiResponseError, SubscriptionPlan } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";
import { Subscription } from "../SubscriptionDetailPage";

const schema = yup.object().shape({
  newPlanId: yup.string().required("Please select a plan"),
});

type ChangePlanData = {
  newPlanId: string;
};

interface ChangePlanDialogProps {
  subscriptionId: string;
  currentPlan: {
    _id: string;
    name: string;
  };
  children: React.ReactNode;
}

export const ChangePlanDialog = ({ subscriptionId, currentPlan, children }: ChangePlanDialogProps) => {
  const [open, setOpen] = useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  useRef<FormPropsRef | null>(null);
  
  const { control, reset } = useForge<ChangePlanData>({
    resolver: yupResolver(schema),
  });

  // Fetch subscription plans
  const { data: plansData, isLoading: plansLoading } = useQuery<ApiResponse<ApiList<SubscriptionPlan>>>({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      return await getRequest({ url: "/subscriptions/plans" });
    },
  });

  const { mutate: changePlan, isPending } = useMutation<
    ApiResponse<Subscription>,
    ApiResponseError,
    { id: string; newPlanId: string }
  >({
    mutationFn: async ({ id, newPlanId }) =>
      await putRequest({
        url: `/subscriptions/${id}/plan`,
        payload: { newPlanId },
      }),
    onSuccess: () => {
      toast.success("Plan Changed", "Subscription plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription", subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setOpen(false);
      reset();
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Plan Change Failed",
        err?.response?.data?.message ?? "Failed to change subscription plan"
      );
    },
  });

  const handleChangePlan = async (data: ChangePlanData) => {
    changePlan({ id: subscriptionId, newPlanId: data.newPlanId });
  };

  // Transform subscription plans data for select options, excluding current plan
  const planOptions = plansData?.data?.data.data
    ?.filter(plan => plan._id !== currentPlan._id)
    ?.map(plan => ({
      label: `${plan.name} - $${plan.price}/${plan.maxUsers} users`,
      value: plan._id,
    })) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
        </DialogHeader>
        <Forge {...{ control, onSubmit: handleChangePlan, }} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current Plan: <span className="font-medium">{currentPlan.name}</span>
            </p>
          </div>
          
          <Forger
            name="newPlanId"
            component={TextSelect}
            label="New Plan"
            placeholder="Select a new plan"
            options={planOptions}
            loading={plansLoading}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || planOptions.length === 0}
              className=" text-white"
            >
              {isPending ? "Changing Plan..." : "Change Plan"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};