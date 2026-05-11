import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Forge, Forger, FormPropsRef, useForge } from "@/lib/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError, User } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { Link, useNavigate } from "react-router-dom";
import { useSetToken, useSetUser } from "@/store/authSlice";
import { SEOWrapper } from "@/components/SEO";
import { useRef } from "react";
import { getFirstAccessibleRoute } from "@/lib/navigation";
import { UserRole } from "@/types";

type FormState = {
  email: string;
  password: string;
};

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

const Login = () => {
  const toast = useToastHandler();
  const formRef = useRef<FormPropsRef>(null)
  const navigate = useNavigate();

  const setToken = useSetToken();
  const setUser = useSetUser();

  const { control } = useForge<FormState>({
    resolver: yupResolver(schema),
  });

  const { mutateAsync, isPending } = useMutation<
    ApiResponse<{ user: User; token: string }>,
    ApiResponseError,
    FormState
  >({
    mutationKey: ["login"],
    mutationFn: async (data) =>
      await postRequest({ url: "/auth/login", payload: data }),
  });

  const onSubmit = async (data: FormState) => {
    try {
      const response = await mutateAsync(data);
      if (response?.data) {
        setUser({
          ...response.data.data.user,
          avatar:
            response.data.data.user.avatar ??
            "https://res.cloudinary.com/dymahyzab/image/upload/v1750346266/AV10_in70j2.png",
        });
        setToken(response.data.data.token);
        toast.success("Login Successful", "Welcome back!");
        
        const userRole = response.data.data.user.role.name as UserRole;
        const modules = response.data.data.user.module;
        const targetRoute = getFirstAccessibleRoute(userRole, modules);
        navigate(targetRoute);
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      toast.error(
        "Login Failed",
        err ?? "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <>
      <SEOWrapper
        title="Login - SwiftPro eProcurement Portal"
        description="Secure login to SwiftPro eProcurement Portal. Access your procurement dashboard, manage solicitations, vendors, and evaluations."
        keywords="login, SwiftPro, eProcurement, procurement portal, secure access, dashboard"
        canonical="/login"
        robots="noindex, nofollow"
      />
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F9FE] dark:bg-gray-950 transition-colors">
      {/* Header with logo */}
      <div className="w-full flex justify-start p-6">
        <img
          src="https://api.swiftpro.tech/api/v1/dev/upload/file-1752307517298-493582260/image9.png"
          alt="SwiftPro Logo"
          className="h-8"
        />
      </div>

      {/* Central card with login form */}
      <Card className="w-[35dvw] p-6 my-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Log into SwiftPro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Forge 
            {...{ control, onSubmit, ref: formRef }} 
            className="grid gap-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isPending) {
                e.preventDefault();
                formRef.current?.onSubmit()
              }
            }}
          >
            <Forger
              name="email"
              label="Email Address"
              placeholder="Enter Email Address"
              type="email"
              component={TextInput}
              data-testid="email-input"
            />
            <Forger
              name="password"
              label="Password"
              placeholder="Enter Password"
              type="password"
              component={TextInput}
              data-testid="password-input"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me">Remember Me</Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" isLoading={isPending} className="w-full" data-testid="login-button">
              Log In
            </Button>
          </Forge>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="w-full flex justify-center p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Powered by AIG Pro Inc
        </p>
      </div>
      </div>
    </>
  );
};

export default Login;
