export const MAX_UPLOAD_FILE_SIZE = 50 * 1024 * 1024; // 50MB, same as FileUploadDialog

export const WIZARD_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".zip",
  ".png",
  ".jpg",
  ".jpeg",
];

/**
 * Validates files picked in an upload step. Returns accepted files plus one
 * human-readable error per rejected file.
 * `existingNames` are names already in the list; names are compared case-insensitively.
 */
export function validateUploadFiles(
  files: File[],
  existingNames: string[],
  allowed: string[] = WIZARD_ALLOWED_EXTENSIONS,
  maxSize: number = MAX_UPLOAD_FILE_SIZE
): { accepted: File[]; errors: string[] } {
  const seen = new Set(existingNames.map((n) => n.toLowerCase()));
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const dot = file.name.lastIndexOf(".");
    const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
    if (!allowed.includes(ext)) {
      errors.push(
        `${file.name}: file type ${ext || "(none)"} is not supported. Allowed types: ${allowed.join(", ")}`
      );
    } else if (file.size === 0) {
      errors.push(`${file.name}: file is empty (0 bytes)`);
    } else if (file.size > maxSize) {
      errors.push(
        `${file.name}: file is larger than the ${maxSize / 1024 / 1024}MB limit`
      );
    } else if (seen.has(file.name.toLowerCase())) {
      errors.push(`${file.name}: a file with this name was already added`);
    } else {
      seen.add(file.name.toLowerCase());
      accepted.push(file);
    }
  }
  return { accepted, errors };
}
