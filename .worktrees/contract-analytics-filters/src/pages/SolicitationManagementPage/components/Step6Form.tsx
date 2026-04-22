import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// import { formatDateTZ } from "@/lib/utils";
import { CreateSolicitationFormData } from "./CreateSolicitationDialog";
import { format } from "date-fns";

interface Step6FormProps {
  formData: CreateSolicitationFormData;
  setStep: (value: number) => void;
  solicitationTypes: Array<{ label: string; value: string }>;
  categoryOptions: Array<{ label: string; value: string }>;
}

const Step6Form = ({
  formData,
  setStep,
  solicitationTypes,
  categoryOptions,
}: Step6FormProps) => {
  // Utility function to safely format date values using date-fns
  const formatDateValue = (value: any, formatStr?: string): string => {
    return value ? format(value, formatStr ?? "MMMM dd, yyyy hh:mm a") : "" //formatDateTZ(value, "MMM dd, yyyy 'at' hh:mm a");
  };

  // Utility function to get name from ID using options
  const getNameFromId = (
    id: string,
    options: Array<{ label: string; value: string }>
  ): string => {
    if (!id) return "Not specified";
    const option = (options ?? []).find((opt) => opt.value === id);
    return option ? option.label : id;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Solicitation Summary
        </h3>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="1">
        <AccordionItem
          value="1"
          className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4"
        >
          <AccordionTrigger className="px-4 py-3 text-[15px] dark:text-gray-200 leading-6 hover:no-underline">
            <span className="font-medium">1. Basic Information</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Solicitation NAme</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData?.solicitationName || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Solicitation ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData?.solId || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getNameFromId(
                      formData?.solicitationType || "",
                      solicitationTypes
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getNameFromId(formData?.category || "", categoryOptions)}
                  </p>
                </div>
                {/* <div>
                  <p className="text-sm text-gray-500">Project Owner</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData.projectOwner || 'Not specified'}
                  </p>
                </div> */}
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {formData?.description || "Not specified"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">✏️</span>
                Edit Information
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="2"
          className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4"
        >
          <AccordionTrigger className="px-4 py-3 text-[15px] dark:text-gray-200 leading-6 hover:no-underline">
            <span className="font-medium">2. Timeline & Bid Details</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Submission Deadline</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateValue(formData?.submissionDeadlineDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Question Acceptance Deadline
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateValue(formData?.questionAcceptanceDeadlineDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bid Intent Deadline</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateValue(formData?.bidIntentDeadlineDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Timezone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData?.timezone || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bid Intent</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData?.bidIntent || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visibility</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData?.visibility || "Not specified"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">✏️</span>
                Edit Information
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="3"
          className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4"
        >
          <AccordionTrigger className="px-4 py-3 text-[15px] dark:text-gray-200 leading-6 hover:no-underline">
            <span className="font-medium">3. Event Details</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {formData?.event && formData?.event?.length > 0 ? (
                formData?.event?.map?.((event: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Event</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {event?.event || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {event.location || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDateValue(event.date, "MMMM dd, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {event.time ? formatDateValue(new Date(`2014-02-11T${event.time}`), "hh:mm a") : "Not specified"}
                        </p>
                      </div>
                    </div>
                    {event.note && (
                      <div>
                        <p className="text-sm text-gray-500">Note</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {event.note}
                        </p>
                      </div>
                    )}
                    {formData.event && index < formData.event.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No events added</p>
              )}
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">✏️</span>
                Edit Information
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="4"
          className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4"
        >
          <AccordionTrigger className="px-4 py-3 text-[15px] dark:text-gray-200 leading-6 hover:no-underline">
            <span className="font-medium">4. Uploaded Documents</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {formData?.documents && formData?.documents?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    Uploaded Documents ({formData.documents.length})
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.documents.map((document, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          •
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {(document as any)?.name ||
                            (document as any)?.path?.split("/").pop() ||
                            `Document ${index + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded</p>
              )}
              <Button
                variant="outline"
                onClick={() => setStep(4)}
                className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">✏️</span>
                Edit Details
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="5"
          className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4"
        >
          <AccordionTrigger className="px-4 py-3 text-[15px] dark:text-gray-200 leading-6 hover:no-underline">
            <span className="font-medium">5. Invited Vendors</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {formData?.vendor && formData?.vendor?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    Invited Vendors ({formData.vendor.length})
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.vendor.map((vendor, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          •
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {vendor?.label || vendor?.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No vendors invited</p>
              )}
              <Button
                variant="outline"
                onClick={() => setStep(5)}
                className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">✏️</span>
                Edit Details
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Step6Form;
