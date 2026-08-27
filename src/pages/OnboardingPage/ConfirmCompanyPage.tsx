import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useAuthentication } from "@/hooks/useAuthentication";
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
  const location = useLocation();
  const isAuthenticated = useAuthentication();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  // Confirming consumes a single-use token — a state-changing action, so this is
  // a mutation, not a query. Firing it once from an effect (guarded by a ref)
  // avoids React Query's read semantics: no refetch on remount/reconnect and no
  // StrictMode double-fire, either of which would re-send the now-spent token
  // and surface a spurious "expired" error on an invite that already succeeded.
  //
  // The endpoint is GET with the token in the query string per the BE contract
  // (docs: GET /auth/vendor/confirm-company?token=). GET for a state-changing
  // consume isn't ideal (prefetch/proxy caching, token in history/Referer), but
  // the HTTP method is the BE's to change — a POST with the token in the body
  // would be the proper fix (flagged for BE). Residual exposure is low: the
  // token is single-use and server-decrypted, so it is inert once consumed, and
  // referrerPolicy="no-referrer" on the outbound link below stops it leaking via
  // the Referer header.
  const {
    mutate: confirmCompany,
    isSuccess,
    isError,
    data,
    error,
  } = useMutation<ApiResponse<ConfirmCompanyData>, ApiResponseError, string>({
    mutationFn: async (inviteToken) =>
      await getRequest({
        url: "/auth/vendor/confirm-company",
        config: { params: { token: inviteToken } },
      }),
  });

  const hasFired = useRef(false);
  useEffect(() => {
    if (hasFired.current || !token) return;
    hasFired.current = true;
    confirmCompany(token);
  }, [token, confirmCompany]);

  // Once confirmed, drop the spent single-use token from the address bar so a
  // bookmarked/shared URL doesn't later render a confusing "expired" error and
  // the token stops lingering in history. getStatus() keys off isSuccess first,
  // so clearing `token` here does NOT flip the success screen back to an error.
  useEffect(() => {
    if (isSuccess && location.search) {
      navigate(location.pathname, { replace: true });
    }
  }, [isSuccess, location.pathname, location.search, navigate]);

  const getStatus = (): "loading" | "success" | "error" => {
    // isSuccess wins first — the success effect above strips the token from the
    // URL, and this ordering keeps the success screen from flipping to "error".
    if (isSuccess) return "success";
    // A missing token can never confirm anything — treat it as an invalid link.
    if (!token || isError) return "error";
    return "loading";
  };
  const status = getStatus();

  const successMessage =
    data?.data?.data?.message ??
    "You have successfully joined the company as a vendor.";

  const errorMessage = !token
    ? "This invitation link is invalid. Please open the link from your invitation email."
    : (error?.response?.data?.message ??
      "This invitation link is invalid or has expired. Please ask the company to resend your invitation.");

  // The invitee often already has an account and may be logged in; since the
  // CTA lands on "/" (which routes authenticated users to their dashboard and
  // guests to login), label it for whichever the viewer actually is.
  const ctaLabel = isAuthenticated ? "Go to Dashboard" : "Go to Login";

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
                {ctaLabel}
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
              {/* Retry recovers a transient PRE-server failure (token never
                  reached the BE, so still valid). But the token is single-use:
                  if the first request already consumed it — including the case
                  where it succeeded but the response was lost — a retry returns
                  "expired". This note steers that case to sign-in instead of
                  looking like a hard failure. A missing token can't be retried
                  at all, so both the note and button are gated on `token`. */}
              {token && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Already opened this link before? Your invitation may already be
                  active — try signing in to check.
                </p>
              )}
              {token && (
                <Button
                  type="button"
                  onClick={() => confirmCompany(token)}
                  className="mt-2 w-full h-11 bg-[#2A4467] hover:bg-[#1e3147] text-white"
                >
                  Try again
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="mt-2 w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {ctaLabel}
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
            referrerPolicy="no-referrer"
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
