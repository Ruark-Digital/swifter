import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError, User } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { TextInput, TextSelect, } from "@/components/layouts/FormInputs";
import { useNavigate, useParams } from "react-router-dom";
import { useSetToken, useSetUser } from "@/store/authSlice";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import swiftproLogo from "@/assets/image9.png";
import timezones from "@/assets/timezones.json";
import CryptoJS from "crypto-js";

type FormState = {
  companyName: string;
  name: string;
  contactEmail: string;
  emailAddress: string;
  timezone: string;
  password: string;
  confirmPassword: string;
};

const schema = yup.object({
  companyName: yup.string().required("Company name is required"),
  name: yup.string().required("Name is required"),
  contactEmail: yup
    .string()
    .email("Invalid email format")
    .required("Contact email is required"),
  emailAddress: yup
    .string()
    .email("Invalid email format")
    .required("Email address is required"),
  timezone: yup.string().required("Time zone is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

// Memoize timezone options to prevent recreation on every render
const timeZoneOptions = [{ label: "Select Timezone", value: "" }, ...timezones];

// Module-scope component (stable reference) so Forge's memoized Forger
// correctly detects prop changes (showPassword/onToggle) and re-renders.
const PasswordFieldInput = ({
  showPassword,
  onToggle,
  label,
  placeholder,
  ...props
}: any) => (
  <TextInput
    {...props}
    label={label}
    placeholder={placeholder}
    type={showPassword ? "text" : "password"}
    endAdornment={
      <button
        type="button"
        onClick={onToggle}
        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    }
  />
);

const OnboardingPage = () => {
  const setUser = useSetUser();
  const setToken = useSetToken();
  const navigate = useNavigate();
  const toast = useToastHandler();
  const [token, setTokenState] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const { encodedData } = useParams<{ encodedData: string }>();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Memoize form resolver to prevent recreation
  const formResolver = useMemo(() => yupResolver(schema), []);

  const { control, setValue } = useForge<FormState>({
    resolver: formResolver,
    defaultValues: {
      companyName: "",
      name: "",
      contactEmail: "",
      emailAddress: "",
      timezone: "",
      password: "",
      confirmPassword: "",
    },
  });

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

  // Decode URL parameter on component mount
  useEffect(() => {
    if (encodedData) {
      try {
        const decoded = decryptData(encodedData);
        if (!decoded || typeof decoded !== "object") {
          console.warn("Decryption returned invalid data format");
          // Show user-friendly error message
          toast.error(
            "Invalid Link",
            "The registration link appears to be invalid or corrupted."
          );
          return;
        }

        const decodedName =
          decoded.name ||
          [decoded.firstName, decoded.lastName].filter(Boolean).join(" ") ||
          "";
        const decodedEmail =
          decoded.emailAddress || decoded.email || decoded.primaryEmail || "";

        setValue("name", decodedName);
        setValue("emailAddress", decodedEmail);
        setValue("companyName", decoded.companyName || "");
        setTokenState(decoded.token);
      } catch (error) {
        console.error("Error processing encoded data:", error);
        toast.error(
          "Link Error",
          "Unable to process the registration link. Please contact support."
        );
      }
    }
  }, []);

  const { mutateAsync, isPending } = useMutation<
    ApiResponse<{ user: User; token: string }>,
    ApiResponseError,
    Omit<FormState, "companyName" | "emailAddress" | "confirmPassword"> & {
      token: string;
    }
  >({
    mutationKey: ["register"],
    mutationFn: async (data) =>
      await postRequest({
        url: "/onboarding/user-accept",
        payload: data,
      }),
  });

  // Memoize submit handler to prevent recreation
  const onSubmit = useCallback(
    async (data: FormState) => {
      try {
        const response = await mutateAsync({
          contactEmail: data.contactEmail,
          name: data.name,
          password: data.password,
          token,
          timezone: data.timezone
        });

        if (response?.data) {
          // console.log(response.data);
          setUser(response.data.data.user);
          setToken(response.data.data.token);
          toast.success("Registration Successful", "Welcome to SwiftPro!");
          navigate("/dashboard");
        }
      } catch (error) {
        // console.log(error);
        const err = error as ApiResponseError;
        toast.error(
          "Registration Failed",
          err?.message ?? "Registration failed. Please try again."
        );
      }
    },
    [mutateAsync, setUser, setToken, toast, navigate]
  );

  // Memoize password toggle handlers to prevent recreation
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950  py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center mb-8">
            <img
              src={swiftproLogo}
              alt="SwiftPro Logo"
              className="h-8 w-auto"
            />
          </div>
        </div>

        <Card className="border-0 dark:bg-gray-900 dark:border-gray-800 mx-auto max-w-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Complete Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Forge control={control} onSubmit={onSubmit}>
              <div className="space-y-4">
                <Forger
                  name="companyName"
                  component={TextInput}
                  disabled
                  label="Company Name"
                  placeholder="Company Name"
                  type="text"
                />

                <Forger
                  name="emailAddress"
                  component={TextInput}
                  disabled
                  label="Email Address (Portal Admin)"
                  placeholder="Email Address"
                  type="email"
                />

                <Forger
                  name="name"
                  component={TextInput}
                  label="Name"
                  placeholder="Full Name"
                  type="text"
                />

                <Forger
                  name="contactEmail"
                  component={TextInput}
                  label="Contact Email"
                  placeholder="Contact Email"
                  type="email"
                />

                <Forger
                  name="timezone"
                  component={TextSelect}
                  label="Time Zone"
                  placeholder="Select Timezone"
                  options={timeZoneOptions}
                />

                <Forger
                  name="password"
                  component={PasswordFieldInput}
                  label="Password"
                  placeholder="Enter Password"
                  showPassword={showPassword}
                  onToggle={togglePasswordVisibility}
                />

                <Forger
                  name="confirmPassword"
                  component={PasswordFieldInput}
                  label="Confirm Password"
                  placeholder="Enter Password"
                  showPassword={showConfirmPassword}
                  onToggle={toggleConfirmPasswordVisibility}
                />

                <Button
                  type="submit"
                  className="w-full h-12  text-white font-medium rounded-lg transition-colors"
                  disabled={isPending}
                  isLoading={isPending}
                >
                  Complete
                </Button>
              </div>
            </Forge>
          </CardContent>
        </Card>
        <div className="text-center pt-2">
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
    </div>
  );
};

export default OnboardingPage;
