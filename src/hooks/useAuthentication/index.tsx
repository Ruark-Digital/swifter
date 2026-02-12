import { useToken, useUser } from "@/store/authSlice";

export const useAuthentication = () => {
  const user = useUser();
  const token = useToken();

  if (user?._id || token) {
    return true;
  }

  try {
    const raw = window.localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const hasUser = !!parsed?.state?.user?._id;
      const hasToken = !!parsed?.state?.token;
      return hasUser || hasToken;
    }
  } catch {
    void 0;
  }

  return false;
};
