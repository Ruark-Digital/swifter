import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@/lib/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponseError } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { Link } from "react-router-dom";
import ForgotPasswordSuccess from "./ForgotPasswordSuccess";

type FormState = {
  email: string;
};

const schema = yup.object().shape({
  email: yup.string().email().required(),
});

const ForgotPassword = () => {
  const handler = useToastHandler();
  const { control } = useForge<FormState>({
    resolver: yupResolver(schema),
  });

  const { mutateAsync, isPending, isSuccess } = useMutation<
    any,
    ApiResponseError,
    FormState
  >({
    mutationKey: ["forgot-password"],
    mutationFn: async (data) =>
      await postRequest({ url: "/auth/forgot-password", payload: data }),
  });

  const onSubmit = async (data: FormState) => {
    try {
      const response = await mutateAsync(data);
      
      if (response?.data) {
        handler.success("Password reset link sent to your email!", "Success");
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      handler.error(err.message || "Failed to send reset link");
    }
  };

  if (isSuccess) {
    return <ForgotPasswordSuccess />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F9FE] dark:bg-gray-950 transition-colors">
      {/* Header with logo */}
      <div className="w-full flex justify-start p-6">
        <img
          src="/src/assets/swiftpro-logo.png"
          alt="SwiftPro Logo"
          className="h-8"
        />
      </div>

      {/* Central card with forgot password form */}
      <Card className="w-[35dvw] p-6 my-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Forgot Password
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Enter the email address or username associated with your SwiftPro account.
          </p>
        </CardHeader>
        <CardContent>
          <Forge {...{ control, onSubmit }} className="grid gap-4">
            <Forger
              name="email"
              label="Email Address"
              placeholder="Enter Email Address"
              type="email"
              component={TextInput}
            />

            <Button 
              type="submit" 
              isLoading={isPending} 
              className="w-full bg-[#4A5568] hover:bg-[#2D3748] text-white">
              Continue
            </Button>
          </Forge>
          
          <div className="mt-4">
            <Link 
              to="/" 
              className="w-full block text-center py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="w-full flex justify-center p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Powered by AIG Pro Inc
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;