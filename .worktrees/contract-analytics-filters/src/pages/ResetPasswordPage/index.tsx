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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

type FormState = {
  password: string;
  confirmPassword: string;
  token: string;
};

const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  token: yup
    .string()
    .required("Reset token is required"),
});

const ResetPassword = () => {
  const handler = useToastHandler();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { control, setValue } = useForge<FormState>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setValue('token', token);
    } else {
      handler.error('Invalid or missing reset token');
      navigate('/');
    }
  }, [searchParams, setValue, handler, navigate]);

  const { mutateAsync, isPending } = useMutation<
    any,
    ApiResponseError,
    { password: string, token: string }
  >({
    mutationKey: ["reset-password"],
    mutationFn: async (data) =>
      await postRequest({ url: "/auth/reset-password", payload: data }),
  });

  const onSubmit = async (data: FormState) => {
    try {
      // Only send password and token to the API (confirmPassword is for frontend validation only)
      const payload = {
        password: data.password,
        token: data.token,
      };
      const response = await mutateAsync(payload);
      
      if (response?.data) {
        handler.success("Password reset successfully!", "Success");
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      if (err.response?.status === 400) {
        handler.error("Invalid or expired reset token");
      } else if (err.response?.status === 422) {
        handler.error("Password validation failed");
      } else {
        handler.error(err.message || "Failed to reset password");
      }
    }
  };

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

      {/* Central card with reset password form */}
      <Card className="w-[35dvw] p-6 my-auto border border-[#E5E7EB]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#0F0F0F] dark:text-white">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Forge {...{ control, onSubmit }} className="grid gap-8">
            <div className="grid gap-8">
              <Forger
                name="password"
                label="New Password"
                placeholder="Enter Password"
                type="password"
                component={TextInput}
              />
              <Forger
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Enter Password"
                type="password"
                component={TextInput}
              />
            </div>

            <div className="grid gap-6">
              <Button 
                type="submit" 
                isLoading={isPending} 
                className="w-full bg-[#2A4467] hover:bg-[#1e3252] text-white font-semibold py-4 px-4 rounded-xl"
              >
                Reset Password
              </Button>
              
              <Link to="/">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-[#F3F4F6] hover:bg-gray-200 text-[#0F0F0F] font-semibold py-4 px-4 rounded-xl border border-[#E5E7EB]"
                >
                  Back to Login
                </Button>
              </Link>
            </div>
          </Forge>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="w-full flex justify-center p-6">
        <p className="text-sm text-[#2A4467] dark:text-gray-400 font-semibold">
          Powered by AIG Pro Inc
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;