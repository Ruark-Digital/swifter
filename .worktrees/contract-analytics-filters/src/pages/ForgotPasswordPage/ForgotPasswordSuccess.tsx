import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ForgotPasswordSuccess = () => {
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

      {/* Central card with success message */}
      <Card className="w-[35dvw] p-6 my-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-base text-gray-900 dark:text-gray-100 leading-6">
              We've sent you an email with instructions to reset your password. Check your inbox and follow the steps there.
            </p>
            <p className="text-base text-gray-900 dark:text-gray-100 leading-6">
              If you didn't request a password change or would like to log in to a different account, select "Return to login."
            </p>
          </div>
          
          <div className="pt-2">
            <Link to="/">
              <Button className="w-full bg-[#2A4467] hover:bg-[#1e3147] text-white font-semibold py-4 rounded-xl">
                Back to Login
              </Button>
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

export default ForgotPasswordSuccess;