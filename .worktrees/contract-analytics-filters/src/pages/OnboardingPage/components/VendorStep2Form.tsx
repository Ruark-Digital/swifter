import React from "react";
import { TextInput, TextSelect } from "@/components/layouts/FormInputs";
import { Forger } from "@/lib/forge";

interface VendorStep2FormProps {
}

const VendorStep2Form: React.FC<VendorStep2FormProps> = () => {
  const businessTypeOptions = [
    { label: "Private Limited, LLC, Sole Proprietor", value: "private_limited" },
    { label: "Corporation", value: "corporation" },
    { label: "Partnership", value: "partnership" },
    { label: "Non-Profit", value: "non_profit" },
  ];

  return (
    <div className="space-y-4">
      <Forger
        name="businessType"
        component={TextSelect}
        label="Business Type"
        placeholder="Private Limited, LLC, Sole Proprietor"
        options={businessTypeOptions}
        containerClass="w-full"
      />

      <Forger
        name="location"
        component={TextInput}
        label="Business Address"
        placeholder="Ottawa, Canada"
        containerClass="w-full"
      />

      <Forger
        name="phone"
        component={TextInput}
        label="Phone Number"
        placeholder="Enter phone number"
        containerClass="w-full"
      />

      <Forger
        name="website"
        component={TextInput}
        label="Website (optional)"
        placeholder="https://www.example.com"
        containerClass="w-full"
      />
    </div>
  );
};

export default VendorStep2Form;
