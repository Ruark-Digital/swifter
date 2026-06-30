import React from "react";
import { TextInput } from "@/components/layouts/FormInputs";
import { Forger } from "@adexdsamson/forge";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PmOnboardingFormProps {}

const PmOnboardingForm: React.FC<PmOnboardingFormProps> = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      <Forger
        name="name"
        component={TextInput}
        label="Name"
        placeholder="John Doe"
        containerClass="w-full"
      />

      <Forger
        name="emailAddress"
        component={TextInput}
        label="Email Address"
        placeholder="john.doe@company.com"
        type="email"
        disabled
        containerClass="w-full"
        autoComplete="email"
      />

      <Forger
        name="phone"
        component={TextInput}
        label="Phone Number"
        placeholder="+1 (555) 000-0000"
        containerClass="w-full"
        autoComplete="tel"
      />

      <Forger
        name="password"
        component={TextInput}
        label="Password"
        placeholder="Enter Password"
        type={showPassword ? "text" : "password"}
        containerClass="w-full"
        autoComplete="new-password"
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        }
      />

      <Forger
        name="confirmPassword"
        component={TextInput}
        label="Confirm Password"
        placeholder="Enter Password"
        type={showConfirmPassword ? "text" : "password"}
        containerClass="w-full"
        autoComplete="new-password"
        endAdornment={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        }
      />
    </div>
  );
};

export default PmOnboardingForm;
