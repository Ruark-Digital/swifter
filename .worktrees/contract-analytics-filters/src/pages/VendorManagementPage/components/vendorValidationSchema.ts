import * as yup from "yup";

// Vendor form validation schema
export const vendorSchema = yup.object({
  name: yup.string().required("Vendor name is required"),
  categoryId: yup.string().required("Category is required"),
  primaryEmail: yup
    .string()
    .email("Valid email is required")
    .required("Primary email is required"),
  secondaryEmails: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        text: yup.string().email("Valid email is required").required(),
      })
    )
    .optional(),
  vendorId: yup.string().required("Vendor ID is required"),
});

// Infer the TypeScript type from the schema
export type VendorFormData = yup.InferType<typeof vendorSchema>;