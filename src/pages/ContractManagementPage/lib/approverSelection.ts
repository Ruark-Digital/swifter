export type PersonnelRoleLike = { _id?: string; name?: string } | string;

export type PersonnelLike = {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: PersonnelRoleLike[] | PersonnelRoleLike | null;
  roles?: PersonnelRoleLike[] | PersonnelRoleLike | null;
};

const humanizeRoleName = (role: string) =>
  role
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeRoleNames = (
  value?: PersonnelRoleLike[] | PersonnelRoleLike | null,
) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((role) =>
      typeof role === "string" ? role : (role?.name ?? ""),
    )
    .map((role) => role.trim())
    .filter(Boolean);
};

export const getPersonnelRoleNames = (person: PersonnelLike) => {
  return Array.from(
    new Set([
      ...normalizeRoleNames(person.role),
      ...normalizeRoleNames(person.roles),
    ]),
  );
};

export const isApproverPersonnel = (person: PersonnelLike) =>
  getPersonnelRoleNames(person).some(
    (role) => role.toLowerCase() === "approver",
  );

export const getPersonnelDisplayName = (person: PersonnelLike) => {
  const name =
    person.name?.trim() ||
    [person.firstName, person.lastName]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" ")
      .trim();

  return name || person.email?.trim() || person._id || "";
};

export const getPersonnelOptionLabel = (person: PersonnelLike) => {
  const name = getPersonnelDisplayName(person);
  const email = person.email?.trim() || "";
  const roles = getPersonnelRoleNames(person);
  const roleLabel =
    roles.length > 1 ? ` - ${roles.map(humanizeRoleName).join(", ")}` : "";

  if (!name) return `${email}${roleLabel}`;
  if (email && email !== name) return `${name} (${email})${roleLabel}`;
  return `${name}${roleLabel}`;
};
