// Helpers for the "Combination" contract type (QA #33).
//
// "Combination" is a BE-provided entry in the contract-type dropdown. When it's
// selected, the user picks a combination of the OTHER contract types; those
// picks are persisted as a comma-separated id string in the single `contractType`
// field (BE convention — there is no dedicated array field in the API).

export type TypeOption = { label: string; value: string };

/** Find the "Combination" entry in the type dropdown by name (its value is a
 *  BE-provided id, so it can't be hardcoded). Returns undefined when absent. */
export const findCombinationTypeId = (
  typeOptions: TypeOption[],
): string | undefined =>
  typeOptions.find((o) => o?.label?.trim().toLowerCase() === "combination")
    ?.value;

/** Resolve the `contractType` value to send to the BE. For a "Combination"
 *  selection, the chosen sub-types go out as a comma-separated id string;
 *  any other selection sends the single selected type id unchanged. Falls back
 *  to the raw `type` if Combination is selected but nothing was picked. */
export const resolveContractTypePayload = (
  type: string | undefined,
  combinationTypeId: string | undefined,
  combinationTypes: unknown,
): string => {
  if (!type) return "";
  if (!combinationTypeId || type !== combinationTypeId) return type;
  const ids = Array.isArray(combinationTypes)
    ? combinationTypes
        .map((o: unknown) =>
          typeof o === "string" ? o : (o as { value?: string } | null)?.value,
        )
        .filter((v: unknown): v is string => typeof v === "string" && !!v)
    : [];
  return ids.length ? ids.join(",") : type;
};

/** Display label for a contract's stored `contractType`. A populated object
 *  shows its name; a single id resolves via the type options; a combination
 *  (comma-separated id string, or an array of ids/objects) shows as
 *  "Combination (A, B)" with unknown ids skipped, or just "Combination" when
 *  none resolve. Returns undefined when there is nothing to show. */
export const formatContractType = (
  contractType: unknown,
  typeOptions: TypeOption[],
): string | undefined => {
  const labelFor = (item: unknown): string | undefined => {
    if (typeof item === "string") {
      const id = item.trim();
      return typeOptions.find((o) => o.value === id)?.label;
    }
    const obj = item as { _id?: string; name?: string } | null;
    return obj?.name || (obj?._id ? labelFor(obj._id) : undefined);
  };

  const items = Array.isArray(contractType)
    ? contractType
    : typeof contractType === "string" && contractType.includes(",")
      ? contractType.split(",").filter((s) => s.trim())
      : [contractType];

  if (items.length < 2) {
    const single = items[0];
    if (typeof single === "string") return labelFor(single) ?? (single.trim() || undefined);
    return labelFor(single);
  }

  const names = items
    .map(labelFor)
    .filter((n): n is string => !!n);
  return names.length ? `Combination (${names.join(", ")})` : "Combination";
};
