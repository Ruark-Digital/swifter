import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import swiftproLogo from "@/assets/image9.png";

// Cross-company vendor invite confirmation.
//
// A vendor who is ALREADY onboarded (under another company) is invited to a new
// company by a procurement lead. The BE emails them a single-use, encrypted
// token link that lands here. Unlike the /vendor-onboarding registration flow,
// there is no account to create — we simply confirm the invite against the
// public GET /auth/vendor/confirm-company?token=... endpoint and report the
// outcome. The route is intentionally NOT wrapped in <PublicRoute>: the
// invitee usually already has an account and may be logged in, and PublicRoute
// would redirect them to their dashboard before the invite is ever confirmed.

type ConfirmCompanyData = { message?: string };

const ConfirmCompanyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { isSuccess, isError, data, error } = useQuery<
    ApiResponse<ConfirmCompanyData>,
    ApiResponseError
  >({
    queryKey: ["confirm-vendor-company", token],
    queryFn: async () =>
      await getRequest({
        url: "/auth/vendor/confirm-company",
        config: { params: { token } },
      }),
    // A missing token can never confirm anything, so don't fire the request —
    // it's surfaced as an invalid link below instead.
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const status: "loading" | "success" | "error" = !token
    ? "error"
    : isSuccess
      ? "success"
      : isError
        ? "error"
        : "loading";

  const successMessage =
    data?.data?.data?.message ??
    "You have successfully joined the company as a vendor.";

  const errorMessage = !token
    ? "This invitation link is invalid. Please open the link from your invitation email."
    : (error?.response?.data?.message ??
      "This invitation link is invalid or has expired. Please ask the company to resend your invitation.");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <img src={swiftproLogo} alt="SwiftPro" className="h-8 w-auto mb-6" />

      <Card className="border border-gray-200 dark:bg-gray-900 dark:border-gray-800 mx-auto max-w-md mt-20 shadow">
        <CardContent className="flex flex-col items-center text-center gap-4 py-10 px-6">
          {status === "loading" && (
            <>
              <Loader2
                className="h-12 w-12 text-[#2A4467] dark:text-[#4A90E2] animate-spin"
                aria-hidden="true"
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Confirming your invitation
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400" role="status">
                Hold on while we add you to the company&hellip;
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2
                className="h-12 w-12 text-green-600 dark:text-green-500"
                aria-hidden="true"
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                You&rsquo;re all set
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {successMessage}
              </p>
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="mt-2 w-full h-11 bg-[#2A4467] hover:bg-[#1e3147] text-white"
              >
                Go to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle
                className="h-12 w-12 text-red-600 dark:text-red-500"
                aria-hidden="true"
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Invitation link problem
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {errorMessage}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="mt-2 w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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

export default ConfirmCompanyPage;
