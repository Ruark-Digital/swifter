import { Forge, useForge } from "@/lib/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import swiftproLogo from "@/assets/image9.png";
import PmOnboardingForm from "./components/PmOnboardingForm";
import { Button } from "@/components/ui/button";
import CryptoJS from "crypto-js";

type PmFormState = {
  name: string;
  emailAddress: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const schema = yup.object({
  name: yup.string().required("Name is required"),
  emailAddress: yup
    .string()
    .email("Invalid email format")
    .required("Email address is required"),
  phone: yup.string().required("Phone number is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const PmOnboardingPage = () => {
  const toast = useToastHandler();
  const navigate = useNavigate();
  const [token, setTokenState] = useState<string>("");
  const { encodedData } = useParams<{ encodedData: string }>();

  const decryptData = useCallback((encryptedData: string): any => {
    try {
      const decryptionKey = import.meta.env.VITE_DECRYPTION_KEY;

      const base64Data = encryptedData.replace(/-/g, "+").replace(/_/g, "/");

      const encryptedBytes = CryptoJS.enc.Base64.parse(base64Data);

      const iv = CryptoJS.lib.WordArray.create(
        encryptedBytes.words.slice(0, 4),
        16
      );
      const ciphertext = CryptoJS.lib.WordArray.create(
        encryptedBytes.words.slice(4),
        encryptedBytes.sigBytes - 16
      );

      const key = CryptoJS.enc.Base64.parse(decryptionKey);

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

  const forge = useForge<PmFormState>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      emailAddress: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (encodedData) {
      try {
        const decoded = decryptData(encodedData);
        if (!decoded || typeof decoded !== "object") {
          toast.error(
            "Invalid Link",
            "The registration link appears to be invalid or corrupted."
          );
          return;
        }

        forge.setValue("name", decoded.name || "");
        forge.setValue("emailAddress", decoded.email || "");
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

  const { mutateAsync: createPm, isPending } = useMutation<
    ApiResponse<{ message: string }>,
    ApiResponseError,
    any
  >({
    mutationKey: ["pmRegister"],
    mutationFn: async (data) =>
      await postRequest({ url: "/onboarding/pm-accept", payload: data }),
  });

  const onSubmit = async (data: PmFormState) => {
    try {
      const apiPayload = {
        token,
        emailAddress: data.emailAddress,
        name: data.name,
        phone: data.phone,
        password: data.password,
      };

      const response = await createPm(apiPayload);

      if (response?.data) {
        toast.success("Registration Successful", "Welcome to SwiftPro!");
        navigate("/");
      }
    } catch (error) {
      const err = error as ApiResponseError;
      toast.error(
        "Registration Failed",
        err?.message ?? "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <img src={swiftproLogo} alt="SwiftPro" className="h-8 w-auto mb-6" />

      <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow rounded-lg border border-gray-200 dark:border-gray-800 max-w-lg mx-auto my-auto mt-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Project Manager Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 mb-5">
            Complete your registration to get started
          </p>
        </div>

        <Forge
          {...{
            control: forge.control,
            onSubmit: onSubmit,
            debug: true,
          }}
        >
          <PmOnboardingForm />

          <div className="space-y-4 pt-6">
            <Button
              type="submit"
              className="w-full h-12 bg-[#2A4467] hover:bg-[#1e3147] text-white"
              disabled={isPending}
            >
              {isPending ? "Registering..." : "Complete Registration"}
            </Button>
          </div>
        </Forge>
      </div>

      <div className="text-center mt-6 mx-auto w-fit">
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

export default PmOnboardingPage;
