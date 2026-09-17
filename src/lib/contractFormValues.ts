import { isEqual } from "lodash";

export const isEmailLike = (value: string) => /.+@.+\..+/.test(value);

export const isObjectIdLike = (value: string) => /^[a-f\d]{24}$/i.test(value);

export const toIdStringOrUndefined = (value: unknown) => {
  const raw =
    typeof value === "string"
      ? value
      : (value as any)?.id || (value as any)?.email || (value as any)?._id;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (isEmailLike(trimmed) || isObjectIdLike(trimmed)) return trimmed;
  return undefined;
};

export const toApproverUserKeyOrUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;

  const normalized = ((value as any)?.value ?? value) as any;
  if (typeof normalized === "string") {
    const trimmed = normalized.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof normalized !== "object" || !normalized) return undefined;

  const candidates = [
    (normalized as any)?.value,
    (normalized as any)?._id,
    (normalized as any)?.id,
    (normalized as any)?.email,
    (normalized as any)?.meta?.email,
    (normalized as any)?.text,
    (normalized as any)?.label,
    (normalized as any)?.name,
  ];

  const strings = candidates
    .filter((c): c is string => typeof c === "string")
    .map((s) => s.trim())
    .filter(Boolean);

  const preferred = strings.find((s) => isObjectIdLike(s) || isEmailLike(s));
  return preferred ?? strings[0];
};

export const toPersonnelOrUndefined = (value: unknown) => {
  if (!value) return undefined;

  const direct = value as any;
  if (
    typeof direct === "object" &&
    (typeof direct.name === "string" || typeof direct.email === "string")
  ) {
    const name =
      typeof direct.name === "string" ? direct.name.trim() : undefined;
    const emailRaw =
      typeof direct.email === "string" ? direct.email.trim() : undefined;
    const email = emailRaw && isEmailLike(emailRaw) ? emailRaw : undefined;
    const role =
      typeof direct.role === "string" ? direct.role.trim() : undefined;
    const phone =
      typeof direct.phone === "string" ? direct.phone.trim() : undefined;
    if (!name && !email) return undefined;
    return {
      ...(name && !(email && isEmailLike(name)) ? { name } : {}),
      ...(email ? { email } : {}),
      ...(role ? { role } : {}),
      ...(phone ? { phone } : {}),
    };
  }

  const normalized = (direct?.value ?? direct) as any;
  if (typeof normalized === "string") {
    const trimmed = normalized.trim();
    if (!trimmed) return undefined;
    if (isEmailLike(trimmed)) return { email: trimmed };
    return { name: trimmed };
  }

  if (typeof normalized === "object" && normalized) {
    const nameRaw =
      typeof normalized.text === "string"
        ? normalized.text.trim()
        : typeof normalized.name === "string"
          ? normalized.name.trim()
          : typeof normalized.label === "string"
            ? normalized.label.trim()
            : undefined;
    const metaEmailRaw =
      typeof normalized?.meta?.email === "string"
        ? normalized.meta.email.trim()
        : undefined;
    const emailRaw =
      typeof normalized.email === "string"
        ? normalized.email.trim()
        : undefined;
    const idRaw =
      typeof normalized.id === "string" ? normalized.id.trim() : undefined;
    const email =
      (metaEmailRaw && isEmailLike(metaEmailRaw) ? metaEmailRaw : undefined) ||
      (emailRaw && isEmailLike(emailRaw) ? emailRaw : undefined) ||
      (idRaw && isEmailLike(idRaw) ? idRaw : undefined) ||
      (nameRaw && isEmailLike(nameRaw) ? nameRaw : undefined);
    const name =
      nameRaw && !(email && nameRaw === email) && !isEmailLike(nameRaw)
        ? nameRaw
        : undefined;
    const role =
      typeof normalized?.meta?.role === "string"
        ? normalized.meta.role.trim()
        : undefined;
    const phone =
      typeof normalized?.meta?.phone === "string"
        ? normalized.meta.phone.trim()
        : undefined;
    if (!name && !email) return undefined;
    return {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(role ? { role } : {}),
      ...(phone ? { phone } : {}),
    };
  }

  return undefined;
};

export const toFileMetaOrUndefined = (value: unknown) => {
  if (!value) return undefined;

  const direct = value as any;
  const name = typeof direct?.name === "string" ? direct.name : undefined;
  const url = typeof direct?.url === "string" ? direct.url : undefined;
  const type = typeof direct?.type === "string" ? direct.type : undefined;

  if (!name || !url || !type) return undefined;

  const sizeRaw = direct?.size;
  const size =
    typeof sizeRaw === "string"
      ? sizeRaw.trim() || undefined
      : typeof sizeRaw === "number"
        ? Number.isFinite(sizeRaw)
          ? String(sizeRaw)
          : undefined
        : sizeRaw === null || sizeRaw === undefined
          ? undefined
          : String(sizeRaw).trim() || undefined;

  const comments = Array.isArray(direct?.comments)
    ? direct.comments
        .map((c: any) => {
          const author = typeof c?.author === "string" ? c.author : undefined;
          const text = typeof c?.text === "string" ? c.text : undefined;
          const date =
            typeof c?.date === "string"
              ? c.date
              : c?.date instanceof Date
                ? c.date.toISOString()
                : undefined;
          if (!author && !text && !date) return undefined;
          return {
            ...(author ? { author } : {}),
            ...(text ? { text } : {}),
            ...(date ? { date } : {}),
          };
        })
        .filter(Boolean)
    : undefined;

  return {
    name,
    url,
    type,
    ...(size ? { size } : {}),
    ...(comments && comments.length > 0 ? { comments } : {}),
  };
};

// Stable key for an attached file. URL is the authoritative identity (the BE
// echoes it back), with the document `_id` and finally the file name as
// fallbacks for entries that predate a URL.
export const fileKey = (file: unknown): string => {
  const f = file as any;
  return (
    (typeof f?.url === "string" && f.url) ||
    (typeof f?._id === "string" && f._id) ||
    (typeof f?.name === "string" && f.name) ||
    ""
  );
};

// Compose a contract's final `files` payload from three sources: the files
// already attached (existing BE files, or RFP docs migrated from an awarded
// solicitation), the set the user removed in the UI, and any newly-uploaded
// documents. Tracking the attached files independently of the shared
// Step4Form's `documents` field is what keeps them from vanishing on a draft
// re-save when that field's hydrate/sync races (QA #127). Deduped by url||name.
export const composeContractFiles = (
  existingFiles: unknown[] | undefined,
  removedKeys: Set<string>,
  newDocuments: unknown[] | null | undefined,
) => {
  const kept = (existingFiles ?? []).filter((f) => !removedKeys.has(fileKey(f)));
  const merged = [...kept, ...(newDocuments ?? [])]
    .map((f) => toFileMetaOrUndefined(f))
    .filter(Boolean) as Array<NonNullable<ReturnType<typeof toFileMetaOrUndefined>>>;

  const seen = new Set<string>();
  return merged.filter((f) => {
    const key = f.url || f.name;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Reduce a fully-built update payload to just the fields the user actually
 * changed, so Edit Contract sends a diff to the BE instead of the whole
 * contract. `full` and `base` must be produced by the SAME builder from the
 * current form values and the originally-loaded values respectively, so
 * derived/nested fields (dates, insurance, approvers, …) compare uniformly.
 * Keys in `alwaysInclude` are kept whenever present in `full` (e.g. control
 * fields the BE needs regardless, like `status`/`timezone`).
 */
export const diffChangedPayload = (
  full: Record<string, unknown>,
  base: Record<string, unknown>,
  alwaysInclude: string[] = [],
): Record<string, unknown> => {
  const changed: Record<string, unknown> = {};
  for (const key of Object.keys(full)) {
    if (!isEqual(full[key], base[key])) changed[key] = full[key];
  }
  for (const key of alwaysInclude) {
    if (key in full) changed[key] = full[key];
  }
  return changed;
};
