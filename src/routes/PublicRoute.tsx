import { useAuthentication } from "@/hooks/useAuthentication";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/store/authSlice";
import { getFirstAccessibleRoute } from "@/lib/navigation";
import { UserRole } from "@/types";

type ProtectedRoute = {
  children: ReactNode;
};

export const PublicRoute = (props: ProtectedRoute) => {
  const isAuthenticated = useAuthentication();
  const user = useUser();

  if (isAuthenticated) {
    const targetRoute = user
      ? getFirstAccessibleRoute(user.role.name as UserRole, user.module)
      : "/dashboard";
    return <Navigate to={targetRoute} />;
  }

  return props.children;
};
