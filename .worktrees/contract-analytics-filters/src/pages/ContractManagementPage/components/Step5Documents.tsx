import React from "react";
import { Upload, FileText, X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Forger } from "@/lib/forge";
import { TextFileUploader } from "@/components/layouts/FormInputs";
import { getSimpleFileExtension, formatFileSize } from "@/lib/fileUtils.tsx";
import { CreateContractFormData } from "./CreateContractSheet";

const Step6Documents: React.FC = () => {
  const { control, setValue } = useFormContext<CreateContractFormData>();
  const value = useWatch({ control, name: "documents" });

  const FileListItem = ({ file }: { file: File }) => {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">
              {getSimpleFileExtension(file.name).toUpperCase()} • {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setValue(
              "documents",
              (value || []).filter((v: File) => v.name !== file.name)
            )
          }
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const UploadElement = () => (
    <div className="text-center">
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">
        Drag & Drop or Click to choose files
      </p>
      <p className="text-xs text-gray-400">
        Supported formats: DOC, PDF, XLS, XLSX, ZIP, PNG, JPEG
      </p>
    </div>
  );

  const acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/zip": [".zip"],
    "image/png": [".png"],
    "image/jpeg": [".jpeg", ".jpg"],
  } as const;

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm font-medium text-slate-700">Upload Files</p>
      <Forger
        name="documents"
        component={TextFileUploader}
        element={<UploadElement />}
        List={FileListItem}
        containerClass="w-full border border-dashed border-gray-900 rounded-lg"
        accept={acceptedFileTypes as any}
        dropzoneOptions={{
          multiple: true,
        }}
      />
    </div>
  );
};

export default Step6Documents;

