import type { CreateEvaluationFormData } from "./CreateEvaluationDialog";
import { toWallClockPayload } from "@/lib/utils";

export type CreateEvaluationDraftPayload = {
  solicitation: string;
  timezone: string;
  start_date: string;
  end_date: string;
  group: Array<{
    name: string;
    evaluators: string[];
  }>;
  documents: Array<{
    title: string;
    type: string;
    group: string;
    required: boolean;
    multiple: boolean;
  }>;
  criteria: Array<{
    title: string;
    description: string;
    type: "pass_fail" | "weight";
    score: string | number;
    group: string;
  }>;
};

// Build the Save as Draft payload from the wizard values, keeping only the
// fields that have actual values. Dates use the same wall-clock serialization
// as Continue; the raw picker Date was sent as a UTC instant (QA N1).
export const buildEvaluationDraftPayload = (
  formData: CreateEvaluationFormData
): Partial<CreateEvaluationDraftPayload> => {
  const draftData: Partial<CreateEvaluationDraftPayload> = {};

  if (formData.solicitation && typeof formData.solicitation === 'string' && formData.solicitation.trim()) {
    draftData.solicitation = formData.solicitation;
  }

  if (formData.timezone && typeof formData.timezone === 'string' && formData.timezone.trim()) {
    draftData.timezone = formData.timezone;
  }

  if (formData.start_date) {
    draftData.start_date = toWallClockPayload(formData.start_date);
  }

  if (formData.end_date) {
    draftData.end_date = toWallClockPayload(formData.end_date);
  }

  if (formData.group && formData.group.length > 0) {
    const validGroups = formData.group
      .filter((group) => group.name && group.name.trim())
      .map((group) => ({
        name: group.name,
        evaluators:
          group.evaluators
            ?.filter((evaluator) => evaluator !== undefined)
            .map((item) => item.value)
            .filter((value) => value && value.trim()) || [],
      }))
      .filter((group) => group.evaluators.length > 0);

    if (validGroups.length > 0) {
      draftData.group = validGroups;
    }
  }

  if (formData.documents && formData.documents.length > 0) {
    const validDocuments = formData.documents
      .filter((document) => document.title && document.title.trim())
      .map((document) => ({
        ...document,
        required: document.required ?? false,
        multiple: document.multiple ?? false,
      }));

    if (validDocuments.length > 0) {
      draftData.documents = validDocuments;
    }
  }

  if (formData.criteria && formData.criteria.length > 0) {
    const validCriteria = formData.criteria
      .filter((criteria) => criteria.title && criteria.title.trim())
      .map((criteria) => ({
        ...criteria,
        score:
          criteria.type === "weight"
            ? parseInt(criteria.score as string)
            : String(criteria.score),
      }));

    if (validCriteria.length > 0) {
      draftData.criteria = validCriteria;
    }
  }

  return draftData;
};
