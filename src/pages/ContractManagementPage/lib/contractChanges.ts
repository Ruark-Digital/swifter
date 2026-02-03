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
  uploaded: Pick<UploadURLs, "name" | "url" | "type">
): { name: string; url: string; type: string; size: number } => {
  return {
    name: uploaded.name || file.name,
    url: uploaded.url,
    type: uploaded.type || file.type,
    size: file.size,
  };
};

export const toManagerCreateChangePayload = (
  values: ManagerCreateChangeDialogValues
): {
  title?: string;
  description?: string;
  type?: "directive" | "proposal";
  urgency?: "low" | "medium" | "high";
  files?: Array<{ name: string; url: string; type: string; size: number }>;
} => {
  const payload: {
    title?: string;
    description?: string;
    type?: "directive" | "proposal";
    urgency?: "low" | "medium" | "high";
    files?: Array<{ name: string; url: string; type: string; size: number }>;
  } = {
    title: values.changeName,
    description: values.description,
  };

  if (values.changeType === "directive" || values.changeType === "proposal") {
    payload.type = values.changeType;
  }

  if (values.urgency === "low" || values.urgency === "medium" || values.urgency === "high") {
    payload.urgency = values.urgency;
  }

  return payload;
};
