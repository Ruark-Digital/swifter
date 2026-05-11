import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextSelect, TextMultiSelect } from "@/components/layouts/FormInputs";

type Props = {
  trigger: React.ReactNode;
};

const SendApprovalDialog: React.FC<Props> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Send for Approval</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm text-slate-600">Select Approvers Group</span>
            <TextSelect
              name="approverGroup"
              placeholder="Select Option"
              options={[{ label: "Group 1 - Approval Level", value: "group1" }]}
            />
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-200 text-sm text-slate-600">
              <span>Group</span>
              <span>Role</span>
              <span>Action</span>
            </div>
            <div className="space-y-2 p-4 text-sm">
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex flex-col">
                  <a href="#" className="text-blue-600 underline">Elise Johnson</a>
                  <a href="#" className="text-blue-600 underline">Mike@acme.com</a>
                </div>
                <span>Legal</span>
                <span className="text-green-600">Assign</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex flex-col">
                  <a href="#" className="text-blue-600 underline">Elise Johnson</a>
                  <a href="#" className="text-blue-600 underline">Mike@acme.com</a>
                </div>
                <span>Legal</span>
                <span className="text-slate-600">Assign</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex flex-col">
                  <a href="#" className="text-blue-600 underline">Elise Johnson</a>
                  <a href="#" className="text-blue-600 underline">Mike@acme.com</a>
                </div>
                <span>Legal</span>
                <span className="text-slate-600">Assign</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-slate-600">Assigned Approvers</span>
            <TextMultiSelect name="assignedApprovers" options={[]} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline">Back</Button>
            <Button>Send for Approval</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendApprovalDialog;

