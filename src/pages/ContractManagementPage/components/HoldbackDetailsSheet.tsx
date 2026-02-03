import React from "react";
import { ArrowLeft, Download, Eye, X } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type Props = { trigger: React.ReactNode };

type AttachedDoc = {
  name: string;
  type: "DOC" | "PDF";
  size: string;
};

const docs: AttachedDoc[] = [
  { name: "RFP_HRSoftware", type: "DOC", size: "25KB" },
  { name: "RFP_HRSoftware", type: "PDF", size: "1MB" },
  { name: "RFP_HRSoftware", type: "DOC", size: "25KB" },
  { name: "RFP_HRSoftware", type: "PDF", size: "1MB" },
];

const HoldbackDetailsSheet: React.FC<Props> = ({ trigger }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="right-4 top-4 bottom-4 h-[calc(100vh-30px)] sm:max-w-4xl p-0 rounded-2xl border border-[#E5E7EB] overflow-hidden [&>button]:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-8 pt-7">
            <div className="flex items-center gap-3">
              <SheetClose asChild>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center">
                  <ArrowLeft className="h-5 w-5 text-[#2A4467]" />
                </button>
              </SheetClose>
              <div className="text-base font-semibold text-[#0F0F0F]">Holdback Details</div>
            </div>

            <SheetClose asChild>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center">
                <X className="h-5 w-5 text-[#EF4444]" />
              </button>
            </SheetClose>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
            <div className="flex justify-end pb-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F0F0F]"
              >
                <img
                  src="/assets/contract-management/payment-summary/share.svg"
                  className="h-4 w-4"
                />
                Export
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-x-16 gap-y-7">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">Release Type</div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">Partial Release</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">Release ID</div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">HB-2025-10</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">Released Amount</div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">$2.5m</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">Released Date</div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">April 30, 2025</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">Status</div>
                  <Badge className="w-fit rounded-full bg-[#FEF9C3] px-4 py-1 text-xs font-semibold text-[#CA8A04] hover:bg-[#FEF9C3]">
                    Pending
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-[#9CA3AF]">Description</div>
                <div className="text-sm font-medium leading-6 text-[#374151]">
                  Lorem ipsum dolor sit amet consectetur. Volutpat quis egestas nunc egestas ut
                  sed accumsan commodo vitae. Ullamcorper feugiat pulvinar consectetur vel
                  natoque amet enim ac sed. Laoreet fringilla sollicitudin pharetra sit proin
                  dictum. Sit sed lorem mauris.
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <div className="text-sm font-semibold text-[#0F0F0F]">Attached Documents</div>
                <div className="grid grid-cols-2 gap-6">
                  {docs.map((d, idx) => (
                    <div
                      key={`${d.type}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            d.type === "PDF" ? "bg-[#FEE2E2]" : "bg-[#DBEAFE]"
                          }`}
                        >
                          <div
                            className={`text-sm font-extrabold ${
                              d.type === "PDF" ? "text-[#EF4444]" : "text-[#2563EB]"
                            }`}
                          >
                            {d.type === "PDF" ? "PDF" : "W"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-[#0F0F0F]">{d.name}</div>
                          <div className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF]">
                            <span>{d.type}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D1D5DB]" />
                            <span>{d.size}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white"
                        >
                          <Eye className="h-4 w-4 text-[#6B7280]" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white"
                        >
                          <Download className="h-4 w-4 text-[#2A4467]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 border-t border-[#E5E7EB] bg-white px-8 py-6">
            <button
              type="button"
              className="h-12 flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-sm font-semibold text-[#0F0F0F]"
            >
              Reject
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-xl bg-[#2A4467] text-sm font-semibold text-white"
            >
              Approve
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HoldbackDetailsSheet;

