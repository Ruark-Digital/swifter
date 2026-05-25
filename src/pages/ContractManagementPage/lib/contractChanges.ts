export type ChangeTabValue = "all" | "requests" | "orders" | "directive" | "proposal";

export type ContractChangeType = "request" | "directive" | "proposal" | "order";

export const changeTabToApiType = (tab: ChangeTabValue): ContractChangeType | undefined => {
  if (tab === "all") return undefined;
  if (tab === "requests") return "request";
  if (tab === "orders") return "order";
  return tab;
};

export const formatChangeTypeLabel = (type: ContractChangeType): string => {
  if (type === "request") return "Request";
  if (type === "order") return "Order";
  if (type === "directive") return "Directive";
  return "Proposal";
};

export const getCreateChangeTypeOptionsForRole = ({
  isManager,
  isVendor,
}: {
  isManager: boolean;
  isVendor: boolean;
}): Array<{ value: ContractChangeType; label: string }> => {
  if (isManager) {
    return [
      { value: "directive", label: "Change Directive" },
      { value: "order", label: "Change Order" },
    ];
  }

  if (isVendor) {
    return [
      { value: "request", label: "Change Request" },
      { value: "order", label: "Change Order" },
      { value: "proposal", label: "Change Proposal" },
    ];
  }

  return [
    { value: "request", label: "Change Request" },
    { value: "order", label: "Change Order" },
    { value: "directive", label: "Change Directive" },
    { value: "proposal", label: "Change Proposal" },
  ];
};

export const shouldShowChangeDecisionActions = (type: string | undefined) => {
  return type !== "directive";
};

export const getManagerApproveChangeUrl = ({
  roleBasePath,
  contractId,
  changeId,
}: {
  roleBasePath: string;
  contractId: string;
  changeId: string;
}) => {
  // ChangeDetailsSheet is dual-purpose (changes + claims) and is invoked
  // from both manager- and approver-prefixed basePaths. Preserve whichever
  // role prefix and entity segment came in, since `/contract/<role>/contracts/
  // {id}/{changes|claims}/{itemId}/approve` is a real endpoint on both roles
  // (see manager + approver APIs).
  const entity =
    roleBasePath.endsWith("/claims") || roleBasePath.includes("/claims/")
      ? "claims"
      : "changes";

  // Case 1: roleBasePath already ends with /{contractId}/{entity} — use as-is.
  if (roleBasePath.endsWith(`/${contractId}/${entity}`)) {
    return `${roleBasePath}/${changeId}/approve`;
  }

  // Case 2: fall back by extracting the role from roleBasePath and rebuilding
  // the full path. Defaults to "manager" when roleBasePath doesn't carry a
  // role segment (matches the prior manager-only behavior).
  const roleMatch = roleBasePath.match(
    /^\/contract\/(manager|approver|vendor|user)\/contracts/,
  );
  const role = roleMatch?.[1] ?? "manager";
  return `/contract/${role}/contracts/${contractId}/${entity}/${changeId}/approve`;
};

export type ManagerCreateChangeDialogValues = {
  changeName: string;
  changeType: string;
  urgency: string;
  description: string;
};

export type UploadURLs = {
  size: string;
  type: string;
  url: string;
  name: string;
  download: string;
};

export const toContractChangeFileItem = (
  file: File,
  uploaded: Pick<UploadURLs, "name" | "url" | "type" | "size">
): { name: string; url: string; type: string; size: string } => {
  return {
    name: uploaded.name || file.name,
    url: uploaded.url,
    type: uploaded.type || file.type,
    size: uploaded.size ?? "",
  };
};

export const toManagerCreateChangePayload = (
  values: ManagerCreateChangeDialogValues
): {
  title?: string;
  description?: string;
  type?: "directive" | "order";
  urgency?: "low" | "medium" | "high";
  files?: Array<{ name: string; url: string; type: string; size: number }>;
} => {
  const payload: {
    title?: string;
    description?: string;
    type?: "directive" | "order";
    urgency?: "low" | "medium" | "high";
    files?: Array<{ name: string; url: string; type: string; size: number }>;
  } = {
    title: values.changeName,
    description: values.description,
  };

  if (
    values.changeType === "directive" ||
    values.changeType === "order"
  ) {
    payload.type = values.changeType as "directive" | "order";
  }

  if (values.urgency === "low" || values.urgency === "medium" || values.urgency === "high") {
    payload.urgency = values.urgency;
  }

  return payload;
};

export const toVendorCreateChangePayload = (
  values: ManagerCreateChangeDialogValues
): {
  title: string;
  description: string;
  type: "request" | "order" | "proposal";
  proposalCategory?: string;
  urgency?: "low" | "medium" | "high";
  files?: Array<{ name: string; url: string; type: string; size: number }>;
} => {
  const type =
    values.changeType === "request" ||
    values.changeType === "order" ||
    values.changeType === "proposal"
      ? (values.changeType as "request" | "order" | "proposal")
      : "request";

  const payload: {
    title: string;
    description: string;
    type: "request" | "order" | "proposal";
    proposalCategory?: string;
    urgency?: "low" | "medium" | "high";
    files?: Array<{ name: string; url: string; type: string; size: number }>;
  } = {
    title: values.changeName,
    description: values.description,
    type,
  };

  if (type === "proposal") {
    payload.proposalCategory = "placeholder";
  }

  if (values.urgency === "low" || values.urgency === "medium" || values.urgency === "high") {
    payload.urgency = values.urgency;
  }

  return payload;
};

export { pruneEmptyValuesDeep } from "@/lib/pruneEmptyValuesDeep";
