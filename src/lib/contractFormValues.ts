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
