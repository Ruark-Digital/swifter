import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Forger, ForgeControl } from "@adexdsamson/forge";
import { TextArea, TextInput } from "@/components/layouts/FormInputs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: ForgeControl<any>;
};

export default function VendorReportSectionsDialog({
  open,
  onOpenChange,
  control,
}: Props) {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-[#2A4467]"
        >
          <div className="flex items-center justify-center w-full gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Create Report
          </div>
        </button>
      </DialogTrigger>
      <DialogContent
        className="rounded-2xl p-8 max-h-[85vh] overflow-y-auto"
        showCloseButton={false}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
                Create Report
              </DialogTitle>
            </DialogHeader>
            <DialogClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-[#0F0F0F]">
              Report Type
            </div>
            <RadioGroup
              value={reportType}
              onValueChange={(val) =>
                setReportType(val as "daily" | "weekly" | "monthly")
              }
              className="flex items-center gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="daily"
                  id="report-type-daily"
                  className="h-5 w-5 border-2 data-[state=checked]:text-[#2A4467]"
                />
                <Label
                  htmlFor="report-type-daily"
                  className="text-sm font-semibold text-[#374151]"
                >
                  Daily
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="weekly"
                  id="report-type-weekly"
                  className="h-5 w-5 border-2 data-[state=checked]:text-[#2A4467]"
                />
                <Label
                  htmlFor="report-type-weekly"
                  className="text-sm font-semibold text-[#374151]"
                >
                  Weekly
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="monthly"
                  id="report-type-monthly"
                  className="h-5 w-5 border-2 data-[state=checked]:text-[#2A4467]"
                />
                <Label
                  htmlFor="report-type-monthly"
                  className="text-sm font-semibold text-[#374151]"
                >
                  Monthly
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="daily-safety" className="border-b">
              <AccordionTrigger className="px-0 text-[#2A4467] text-base font-semibold hover:no-underline">
                Daily Safety Topic
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <Forger
                  name="dailySafetyTopic"
                  component={TextInput}
                  placeholder="Enter Topic"
                  containerClass="space-y-2"
                  control={control}
                />
              </AccordionContent>
            </AccordionItem>
            {[
              { key: "incidentsSummary", label: "Summary of any incidents" },
              { key: "workPerformed", label: "Work performed" },
              {
                key: "advanceVsPlan",
                label: "Actual advance versus planned with variance commentary",
              },
              { key: "delays", label: "Delays (internal versus external)" },
              { key: "manpowerSummary", label: "Manpower summary" },
              { key: "equipmentDowntime", label: "Equipment downtime" },
              { key: "extraWork", label: "Extra work and T&M Work summary" },
              { key: "risksOpportunities", label: "Risks and opportunities" },
              {
                key: "qualityTechnical",
                label: "Quality and technical matters, issues or decisions.",
              },
            ].map(({ key, label }) => (
              <AccordionItem key={key} value={key} className="border-b">
                <AccordionTrigger className="px-0 text-[#2A4467] text-base font-semibold hover:no-underline">
                  {label}
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <Forger
                    name={key as any}
                    component={TextArea}
                    placeholder={
                      key === "qualityTechnical"
                        ? "Add NCR details if applicable"
                        : "Enter Detail"
                    }
                    containerClass="space-y-2"
                    control={control}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex items-center gap-4 pt-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-slate-900"
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="h-12 flex-1 rounded-xl bg-[#2A4467] text-white">
                Submit Report
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
