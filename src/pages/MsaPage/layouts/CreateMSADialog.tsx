import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Step1BasicInfo from "../components/Step1BasicInfo";
import Step2ContractTeam from "../components/Step2ContractTeam";
import Step3Timeline from "../components/Step3Timeline";
import Step4Deliverables from "../components/Step4Deliverables";
import Step5ValuePayments from "../components/Step5ValuePayments";
import Step6ComplianceSecurity from "../components/Step6ComplianceSecurity";
import Step7Documents from "../components/Step7Documents";
import Step8ApprovalLevel from "../components/Step8ApprovalLevel";
import Step9ReviewPublish from "../components/Step9ReviewPublish";

type Props = {
  trigger: React.ReactNode;
};

const schema = yup.object({
  name: yup.string().required("MSA name is required"),
  type: yup.string().required("MSA type is required"),
  manager: yup.string().optional(),
  jobTitle: yup.string().optional(),
  msaId: yup.string().optional(),
  description: yup.string().optional(),
  rating: yup.number().min(1).max(10).required(),
  businessDivision: yup.string().optional(),
  vendor: yup.string().optional(),
  personnel: yup.array().optional(),
  internalTeam: yup.array().optional(),
  visibility: yup.string().optional(),
  effectiveDate: yup.date().optional(),
  endDate: yup.date().optional(),
  duration: yup.string().optional(),
  termType: yup.string().optional(),
  draftStartDate: yup.date().optional(),
  draftEndDate: yup.date().optional(),
  reviewStartDate: yup.date().optional(),
  reviewEndDate: yup.date().optional(),
  approvalStartDate: yup.date().optional(),
  approvalEndDate: yup.date().optional(),
  executionStartDate: yup.date().optional(),
  executionEndDate: yup.date().optional(),
  deliverables: yup
    .array()
    .of(
      yup.object({
        name: yup.string().optional(),
        dueDate: yup.date().optional(),
      }),
    )
    .optional(),
  contractValue: yup.mixed().optional(),
  contingency: yup.string().optional(),
  holdback: yup.string().optional(),
  paymentStructure: yup.string().optional(),
  paymentTerm: yup.string().optional(),
  milestones: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        amount: yup.mixed().optional(),
        dueDate: yup.date().optional(),
        deliverable: yup.string().optional(),
      }),
    )
    .optional(),
  insuranceExpiryDate: yup.date().optional(),
  contractSecurity: yup.string().optional(),
  securityType: yup.string().optional(),
  securityAmount: yup.string().optional(),
  securityDueDate: yup.date().optional(),
  insurancePolicies: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        limit: yup.string().optional(),
      }),
    )
    .optional(),
  securities: yup
    .array(
      yup.object({
        type: yup.string().optional(),
        amount: yup.mixed().optional(),
        dueDate: yup.date().optional(),
      }),
    )
    .optional(),
  documents: yup.array().optional(),
  approvalGroupSelection: yup.string().optional(),
  assignedApprovers: yup.array().optional(),
  approvalGroups: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        approvers: yup.array().optional(),
        approvalLevel: yup.string().optional(),
        amount: yup.mixed().optional(),
      }),
    )
    .optional(),
});

export type CreateMsaFormData = yup.InferType<typeof schema>;

const defaultValues: CreateMsaFormData = {
  name: "",
  type: "",
  manager: "",
  jobTitle: "",
  msaId: "",
  description: "",
  rating: 1,
  businessDivision: "",
  vendor: "",
  personnel: [],
  internalTeam: [],
  visibility: "",
  effectiveDate: undefined,
  endDate: undefined,
  duration: "",
  termType: "",
  draftStartDate: undefined,
  draftEndDate: undefined,
  reviewStartDate: undefined,
  reviewEndDate: undefined,
  approvalStartDate: undefined,
  approvalEndDate: undefined,
  executionStartDate: undefined,
  executionEndDate: undefined,
  deliverables: [{ name: "Deliverable 1", dueDate: undefined }],
  contractValue: "",
  contingency: "",
  holdback: "",
  paymentStructure: "",
  paymentTerm: "",
  milestones: [{ name: "", amount: "", dueDate: undefined, deliverable: "" }],
  insuranceExpiryDate: undefined,
  contractSecurity: "",
  securityType: "",
  securityAmount: "",
  securityDueDate: undefined,
  insurancePolicies: [{ name: "", limit: "" }],
  securities: [],
  documents: [],
  approvalGroupSelection: "",
  assignedApprovers: [],
  approvalGroups: [{ name: "Group 1", approvers: [], approvalLevel: "1", amount: "" }],
};

const STEP_TITLES = [
  "Step 1 of 9: Basic Information",
  "Step 2 of 9: Contract Team",
  "Step 3 of 9: Timeline",
  "Step 4 of 9: Deliverables",
  "Step 5 of 9: Contract Value & Payments",
  "Step 6 of 9: Compliance & Security",
  "Step 7 of 9: Documents",
  "Step 8 of 9: Configure Approval Level",
  "Step 9 of 9: Review & Publish",
];

const CreateMSADialog: React.FC<Props> = ({ trigger }) => {
  const {
    control,
    reset,
    trigger: formTrigger,
    getValues,
  } = useForge<CreateMsaFormData>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const [step, setStep] = React.useState(1);
  const [open, setOpen] = React.useState(false);

  const validateStep = async (currentStep: number) => {
    if (currentStep === 1) {
      const ok = await formTrigger(["name", "type", "rating"] as any, {
        shouldFocus: true,
      });
      return ok;
    }
    return true;
  };

  // Step-specific data fetching moved into step components

  const onSubmit = async (data: CreateMsaFormData) => {
    setOpen(false);
    reset(defaultValues);
    console.log("Create MSA submit:", data);
  };

  const onCancel = () => {
    reset(defaultValues);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl p-6 gap-6 sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <DialogHeader className="p-0">
            <DialogTitle className="text-[20px] font-semibold leading-[30px] text-[#0F0F0F]">
              Create MSA
            </DialogTitle>
          </DialogHeader>
        </div>

        <p className="text-sm font-medium text-[#0F0F0F]">{STEP_TITLES[step - 1]}</p>

        <Forge
          control={control}
          onSubmit={onSubmit}
          className="space-y-6"
          data-testid="create-msa-dialog"
        >
          {step === 1 && <Step1BasicInfo />}
          {step === 2 && <Step2ContractTeam />}
          {step === 3 && <Step3Timeline />}
          {step === 4 && <Step4Deliverables control={control} />}
          {step === 5 && <Step5ValuePayments control={control} />}
          {step === 6 && <Step6ComplianceSecurity control={control} />}
          {step === 7 && <Step7Documents />}
          {step === 8 && <Step8ApprovalLevel />}
          {step === 9 && <Step9ReviewPublish control={control} />}

          {step === 1 ? (
            <div className="flex w-full gap-6 pt-2">
              <DialogClose className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] text-[#0F0F0F] hover:bg-[#E5E7EB]"
                  onClick={onCancel}
                  data-testid="cancel-create-msa"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="flex-1 h-12 rounded-xl"
                data-testid="continue-create-msa"
                onClick={async () => {
                  const ok = await validateStep(1);
                  if (ok) setStep(2);
                }}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="flex w-full gap-6 pt-2 justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => {
                  const vals = getValues();
                  onSubmit(vals as CreateMsaFormData);
                }}
              >
                Save as Draft
              </Button>
              <div className="flex gap-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl bg-slate-300"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
                <Button
                  type={step === 9 ? "submit" : "button"}
                  onClick={async () => {
                    if (step === 9) return;
                    const ok = await validateStep(step);
                    if (ok) setStep(step + 1);
                  }}
                  className="h-12 rounded-xl"
                >
                  {step === 9 ? "Publish" : "Continue"}
                </Button>
              </div>
            </div>
          )}
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMSADialog;
