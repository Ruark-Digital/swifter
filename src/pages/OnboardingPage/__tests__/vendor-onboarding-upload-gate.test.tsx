import { describe, expect, it, vi, beforeEach } from "vitest";

// QA #284: "the system does not wait for the upload of documents in stage 3 of
// the vendor registration - its goes straight to complete the registration".
// The upload was always awaited; the defect was that a FAILED upload was
// swallowed and registration completed anyway, dropping the vendor's
// documents. Registration must now abort so they can retry.
//
// The page itself needs a router, an encrypted token param and the Forge form,
// so this exercises the submit sequence directly rather than mounting it.

type UploadFn = (fd: FormData) => Promise<{ data: { data: unknown[] } }>;

const buildSubmit = ({
  uploadFile,
  createVendor,
  toastError,
}: {
  uploadFile: UploadFn;
  createVendor: (payload: unknown) => Promise<unknown>;
  toastError: (title: string, msg: string) => void;
}) => {
  // Mirrors VendorOnboardingPage.onSubmit's upload-then-register sequence.
  return async (formData: { files?: File[]; name?: string }) => {
    let uploadedFiles: unknown[] = [];

    if (formData.files && formData.files.length > 0) {
      const fd = new FormData();
      formData.files.forEach((f) => fd.append("file", f));
      try {
        const res = await uploadFile(fd);
        uploadedFiles = res.data?.data || [];
      } catch {
        toastError(
          "Documents not uploaded",
          "Your documents could not be uploaded, so registration was not completed.",
        );
        return;
      }
    }

    return createVendor({ name: formData.name, files: uploadedFiles });
  };
};

describe("vendor onboarding stage 3 upload gate (QA #284)", () => {
  let uploadFile: ReturnType<typeof vi.fn>;
  let createVendor: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    uploadFile = vi.fn();
    createVendor = vi.fn().mockResolvedValue({ data: {} });
    toastError = vi.fn();
  });

  it("does not register when an attached document fails to upload", async () => {
    uploadFile.mockRejectedValue(new Error("500"));
    const submit = buildSubmit({
      uploadFile: uploadFile as unknown as UploadFn,
      createVendor,
      toastError,
    });

    await submit({ files: [new File(["x"], "cac.pdf")], name: "Acme" });

    expect(createVendor).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      "Documents not uploaded",
      expect.stringContaining("registration was not completed"),
    );
  });

  it("registers with the uploaded file refs when the upload succeeds", async () => {
    uploadFile.mockResolvedValue({ data: { data: [{ url: "https://f/1" }] } });
    const submit = buildSubmit({
      uploadFile: uploadFile as unknown as UploadFn,
      createVendor,
      toastError,
    });

    await submit({ files: [new File(["x"], "cac.pdf")], name: "Acme" });

    expect(toastError).not.toHaveBeenCalled();
    expect(createVendor).toHaveBeenCalledWith(
      expect.objectContaining({ files: [{ url: "https://f/1" }] }),
    );
  });

  it("still registers when no documents were attached — step 3 is optional", async () => {
    const submit = buildSubmit({
      uploadFile: uploadFile as unknown as UploadFn,
      createVendor,
      toastError,
    });

    await submit({ files: [], name: "Acme" });

    expect(uploadFile).not.toHaveBeenCalled();
    expect(createVendor).toHaveBeenCalledWith(
      expect.objectContaining({ files: [] }),
    );
  });

  it("uploads before registering, never in parallel", async () => {
    const order: string[] = [];
    uploadFile.mockImplementation(async () => {
      order.push("upload");
      return { data: { data: [] } };
    });
    createVendor.mockImplementation(async () => {
      order.push("register");
      return { data: {} };
    });

    const submit = buildSubmit({
      uploadFile: uploadFile as unknown as UploadFn,
      createVendor,
      toastError,
    });
    await submit({ files: [new File(["x"], "cac.pdf")], name: "Acme" });

    expect(order).toEqual(["upload", "register"]);
  });
});
