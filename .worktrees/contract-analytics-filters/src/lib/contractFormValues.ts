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

export const toPersonnelOrUndefined = (value: unknown) => {
  if (!value) return undefined;

  const direct = value as any;
  if (
    typeof direct === "object" &&
    (typeof direct.name === "string" || typeof direct.email === "string")
  ) {
    const name = typeof direct.name === "string" ? direct.name.trim() : undefined;
    const email = typeof direct.email === "string" ? direct.email.trim() : undefined;
    const role = typeof direct.role === "string" ? direct.role.trim() : undefined;
    const phone = typeof direct.phone === "string" ? direct.phone.trim() : undefined;
    if (!name && !email) return undefined;
    return {
      ...(name ? { name } : {}),
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
    const name =
      typeof normalized.text === "string"
        ? normalized.text.trim()
        : typeof normalized.name === "string"
          ? normalized.name.trim()
          : typeof normalized.label === "string"
            ? normalized.label.trim()
            : undefined;
    const email =
      typeof normalized.email === "string"
        ? normalized.email.trim()
        : typeof normalized.id === "string"
          ? normalized.id.trim()
          : undefined;
    const role =
      typeof normalized?.meta?.role === "string" ? normalized.meta.role.trim() : undefined;
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

