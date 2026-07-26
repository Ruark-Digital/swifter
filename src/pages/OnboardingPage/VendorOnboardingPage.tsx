import { Forge, useForge } from "@adexdsamson/forge";
import * as yup from "yup";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import swiftproLogo from "@/assets/image9.png";
import VendorStep1Form from "./components/VendorStep1Form";
import VendorStep2Form from "./components/VendorStep2Form";
import VendorStep3Form from "./components/VendorStep3Form";
import { Button } from "@/components/ui/button";
import CryptoJS from "crypto-js";

// Upload file response interface
export interface UploadFileResponse {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
}

// Form validation schemas for each step
const step1Schema = yup.object({
  name: yup.string().required("Name is required"),
  emailAddress: yup
    .string()
    .email("Invalid email format")
    .required("Email address is required"),
  category: yup.string().required("Category is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const step2Schema = yup.object({
  businessType: yup.string().required("Business type is required"),
  location: yup.string().required("Location is required"),
  phone: yup.string().required("Phone number is required"),
  website: yup.string().url("Invalid URL format").optional(),
});

const step3Schema = yup.object({
  files: yup.array().optional(), // Files are optional for step 3
});

type Step1FormData = yup.InferType<typeof step1Schema>;
type Step2FormData = yup.InferType<typeof step2Schema>;
type Step3FormData = yup.InferType<typeof step3Schema>;

type VendorFormState = Step1FormData & Step2FormData & Step3FormData;

const VendorOnboardingPage = () => {
  const toast = useToastHandler();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [token, setTokenState] = useState<string>("");
  const { encodedData } = useParams<{ encodedData: string }>();

  // Memoize decryption function to prevent recreation on every render
  const decryptData = useCallback((encryptedData: string): any => {
    try {
      const decryptionKey = import.meta.env.VITE_DECRYPTION_KEY;

      // Convert base64url to base64
      const base64Data = encryptedData.replace(/-/g, "+").replace(/_/g, "/");

      // Parse the encrypted data
      const encryptedBytes = CryptoJS.enc.Base64.parse(base64Data);

      // Extract IV (first 16 bytes) and ciphertext (remaining bytes)
      const iv = CryptoJS.lib.WordArray.create(
        encryptedBytes.words.slice(0, 4),
        16
      );
      const ciphertext = CryptoJS.lib.WordArray.create(
        encryptedBytes.words.slice(4),
        encryptedBytes.sigBytes - 16
      );

      // Parse the key
      const key = CryptoJS.enc.Base64.parse(decryptionKey);

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        ciphertext.toString(CryptoJS.enc.Base64),
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error("Error decrypting data:", error);
      return null;
    }
  }, []);

  // Single form instance for all steps
  const forge = useForge<VendorFormState>({
    defaultValues: {
      name: "",
      emailAddress: "",
      category: "",
      password: "",
      confirmPassword: "",
      phone: "",
      location: "",
      businessType: "",
      website: "",
    },
  });

  // Decode URL parameter on component mount
  useEffect(() => {
    if (encodedData) {
      try {
        const decoded = decryptData(encodedData);
        // console.log("encodeData", encodedData, decoded);
        if (!decoded || typeof decoded !== "object") {
          console.warn("Decryption returned invalid data format");
          // Show user-friendly error message
          toast.error(
            "Invalid Link",
            "The registration link appears to be invalid or corrupted."
          );
          return;
        }
        // console.log({ decoded })

        const decodedName =
          decoded.name ||
          [decoded.firstName, decoded.lastName].filter(Boolean).join(" ") ||
          "";
        const decodedEmail =
          decoded.emailAddress || decoded.email || decoded.primaryEmail || "";

        forge.setValue("name", decodedName);
        forge.setValue("emailAddress", decodedEmail);
        setTokenState(decoded.token);
      } catch (error) {
        console.error("Error processing encoded data:", error);
        toast.error(
          "Link Error",
          "Unable to process the registration link. Please contact support."
        );
      }
    }
  }, [encodedData, decryptData]);

  const queryClient = useQueryClient();

  // File upload mutation
  const { mutateAsync: uploadFile, isPending: isUploadingFiles } = useMutation<
    ApiResponse<UploadFileResponse[]>,
    ApiResponseError,
    FormData
  >({
    mutationKey: ["uploadFile"],
    mutationFn: async (formData) =>
      await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      }),
    onError: (error) => {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Upload Error",
        err?.response?.data?.message ?? "Failed to upload files"
      );
    },
  });

  const { mutateAsync: createVendor, isPending: isCreatingVendor } =
    useMutation<ApiResponse<{ message: string }>, ApiResponseError, any>({
      mutationKey: ["vendorRegister"],
      mutationFn: async (data) =>
        await postRequest({ url: "/onboarding/vendor-accept", payload: data }),
      onSuccess: () => {
        // Invalidate vendor-related queries to trigger automatic refetch
        queryClient.invalidateQueries({ queryKey: ["vendors"] });
        queryClient.invalidateQueries({ queryKey: ["vendorDashboard"] });
        queryClient.invalidateQueries({ queryKey: ["vendorCategories"] });
        // Also invalidate solicitation-related queries that might include vendor data
        queryClient.invalidateQueries({ queryKey: ["solicitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-solicitations"] });
      },
    });

  const onSubmit = async (data: any) => {
    try {
      const formData = forge.getValues() ?? data;
      let uploadedFiles: UploadFileResponse[] = [];

      // Upload files first if any exist
      if (formData.files && formData.files?.length > 0) {
        const fileFormData = new FormData();

        // Add all files to FormData
        formData.files.forEach((file: File) => {
          fileFormData.append("file", file);
        });

        try {
          const uploadResponse = await uploadFile(fileFormData);
          uploadedFiles = uploadResponse.data?.data || [];
        } catch (uploadError) {
          // Stop here rather than registering without the documents (QA #284).
          // Step 3 being "(Optional)" means attaching files is optional — not
          // that files the vendor DID attach may be silently dropped. Leaving
          // them on this step lets them retry; the upload mutation's own
          // onError has already surfaced the underlying reason.
          toast.error(
            "Documents not uploaded",
            "Your documents could not be uploaded, so registration was not completed. Please try again, or remove the files to continue without them."
          );
          return;
        }
      }

      // Map form fields to API expected fields
      const apiPayload = {
        token,
        password: formData.password,
        name: formData.name,
        category: formData.category,
        businessType: formData.businessType,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        files: uploadedFiles, // Use uploaded file data from API response
      };

      const response = await createVendor(apiPayload);

      if (response?.data) {
        console.log(response.data);
        toast.success("Registration Successful", "Welcome to SwiftPro!");
        navigate("/"); // Navigate to login since API doesn't return user/token
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Registration Failed",
        err?.message ?? "Registration failed. Please try again."
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validate the current step and advance. Extracted so the footer button can
  // stay type="button" always (see the button below for why that matters).
  const handleNextStep = async () => {
    let isValid = false;
    try {
      if (currentStep === 1) {
        await step1Schema.validate(forge.getValues(), {
          abortEarly: false,
        });
      } else if (currentStep === 2) {
        await step2Schema.validate(forge.getValues(), {
          abortEarly: false,
        });
      }
      isValid = true;
    } catch (error: any) {
      // Show validation errors
      if (error.inner) {
        error.inner.forEach((err: any) => {
          forge.setError(err.path, { message: err.message });
        });
      }
      toast.error(
        "Validation Error",
        "Please fill in all required fields correctly."
      );
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Step 1 of 3: Basic Account Setup";
      case 2:
        return "Step 2 of 3: Vendor Information";
      case 3:
        return "Step 3 of 3: Document Upload (Optional)";
      default:
        return "Step 1 of 3: Basic Account Setup";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <img src={swiftproLogo} alt="SwiftPro" className="h-8 w-auto mb-6" />

      <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow rounded-lg border border-gray-200 dark:border-gray-800 max-w-lg mx-auto my-auto mt-20">
        <div className=" ">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Complete Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 mb-5">
            {getStepTitle()}
          </p>
        </div>

        <div className="">
          <Forge
            {...{
              control: forge.control,
              onSubmit: onSubmit,
            }}
          >
            {currentStep === 1 && <VendorStep1Form />}

            {currentStep === 2 && <VendorStep2Form />}

            {currentStep === 3 && (
              <VendorStep3Form
                {...{
                  control: forge.control,
                  setValue: forge.setValue,
                }}
              />
            )}

            <div className="space-y-4 pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 w-full"
                  disabled={isUploadingFiles || isCreatingVendor}
                >
                  Back
                </Button>
              )}
              {/* Always keep this button type="button". If its type flipped to
                  a submit type on the final step, the browser would own when
                  the form fires: the click that advances the wizard mutates
                  this same node to a submit control before the browser
                  evaluates that click's default action, so merely ARRIVING at
                  step 3 would submit and register the vendor before "Complete
                  Registration" is pressed. Submission is now driven explicitly
                  by this click only. */}
              <Button
                type="button"
                onClick={
                  currentStep === 3
                    ? forge.handleSubmit(onSubmit)
                    : handleNextStep
                }
                className="w-full h-12 bg-[#2A4467] hover:bg-[#1e3147] text-white"
                disabled={
                  currentStep === 3 && (isUploadingFiles || isCreatingVendor)
                }
              >
                {currentStep === 3
                  ? isUploadingFiles
                    ? "Uploading Files..."
                    : isCreatingVendor
                    ? "Registering..."
                    : "Complete Registration"
                  : "Continue"}
              </Button>
            </div>
          </Forge>
        </div>
      </div>

      <div className="text-center mt-6 mx-auto w-fit ">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Powered by{" "}
          <a
            href="https://aigproinc.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#2A4467] dark:text-[#4A90E2] hover:underline cursor-pointer"
          >
            AIG Pro Inc
          </a>
        </p>
      </div>
    </div>
  );
};

export default VendorOnboardingPage;
