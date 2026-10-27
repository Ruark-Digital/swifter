import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";

export type Mentionable = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

type RawRole = string | { name?: string; _id?: string } | undefined | null;
type RawMember = {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
  // Backend can return role as a populated object `{_id, name}` or as a raw
  // string. Coerce to string in toMentionable so React renders cleanly.
  role?: RawRole;
  user?: { _id?: string; name?: string; email?: string };
};

const coerceRole = (role: RawRole): string | undefined => {
  if (!role) return undefined;
  if (typeof role === "string") return role;
  if (typeof role === "object" && typeof role.name === "string") return role.name;
  return undefined;
};

const toMentionable = (m: RawMember): Mentionable | null => {
  const id = m._id || m.id || m.user?._id || m.email || m.user?.email || "";
  const name = m.name || m.user?.name || m.email || m.user?.email || "";
  if (!id || !name) return null;
  return {
    id,
    name,
    email: m.email || m.user?.email,
    role: coerceRole(m.role),
  };
};

/**
 * Returns the personnel endpoint matching the current user's role.
 *
 * Per API_DOCUMENTATION_PHASE_2.md:
 * - Manager:  GET /manager/personnel/contract/{contractId}
 * - Approver: GET /approver/contracts/{contractId}/personnel
 * - Vendor:   GET /vendor/contracts/{contractId}/personnel
 */
const buildPersonnelUrl = ({
  contractId,
  isManager,
  isApprover,
  isVendor,
  isProjectManager,
}: {
  contractId: string;
  isManager: boolean;
  isApprover: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
}): string | null => {
  // axios baseURL is /api/v1/dev — swagger paths live under /contract.
  if (isManager) return `/contract/manager/personnel/contract/${contractId}`;
  if (isApprover) return `/contract/approver/contracts/${contractId}/personnel`;
  if (isVendor || isProjectManager)
    return `/contract/vendor/contracts/${contractId}/personnel`;
  return null;
};

/**
 * Fetches users attached to a contract — used to power @mentions in the
 * collaboration tool. Routes to the correct role-scoped endpoint.
 */
export function useContractMentionables(contractId: string | undefined) {
  const { isManager, isApprover, isVendor, isProjectManager } = useUserRole();
  const url = contractId
    ? buildPersonnelUrl({
        contractId,
        isManager,
        isApprover,
        isVendor,
        isProjectManager,
      })
    : null;

  return useQuery<Mentionable[]>({
    queryKey: ["contract-mentionables", contractId, url],
    enabled: Boolean(url),
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const res = await getRequest({ url: url as string });
      const raw =
        (res.data as { data?: RawMember[] } | undefined)?.data ??
        (res.data as RawMember[] | undefined) ??
        [];
      return (Array.isArray(raw) ? raw : [])
        .map(toMentionable)
        .filter((m): m is Mentionable => m !== null);
    },
  });
}
