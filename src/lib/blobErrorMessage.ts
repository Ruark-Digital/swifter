/**
 * Read the server's error message from a failed `responseType: "blob"`
 * request. Axios hands back the JSON error body as a Blob in that mode, so
 * `error.response.data.message` is always undefined and the real reason is
 * lost. Returns undefined when the body has no readable message.
 */
export const getBlobErrorMessage = async (
  error: unknown,
): Promise<string | undefined> => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return typeof parsed?.message === "string" ? parsed.message : undefined;
    } catch {
      return undefined;
    }
  }
  const message = (data as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
};
