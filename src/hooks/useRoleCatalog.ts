import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Role, UserRole } from "@/types";

/**
 * The role catalog from `GET /onboarding/roles`. Items are populated Role
 * objects (`{ _id, name, __v }`) — the same shape as User.role — so this gives
 * a document-id -> role-name map used to resolve any bare id strings that a
 * User.roles payload might carry. Shares the ["roles"] query cache with the
 * user dialogs, so it costs at most one request.
 *
 * Pass `enabled = false` to skip the fetch when no id resolution is needed
 * (e.g. roles already arrive as populated objects or name slugs).
 */
export const useRoleCatalog = (enabled = true) => {
  const { data } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await getRequest({ url: "/onboarding/roles" }),
    staleTime: Infinity,
    enabled,
  });

  const roles: Role[] = data?.data?.data ?? [];

  const idToName = useMemo(() => {
    const map = new Map<string, UserRole>();
    roles.forEach((role) => {
      if (role?._id && role?.name) map.set(role._id, role.name);
    });
    return map;
  }, [roles]);

  return { idToName, roles };
};
