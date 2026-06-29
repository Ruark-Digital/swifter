import React from "react";
import { TextFileUploader } from "@/components/layouts/FormInputs";
import { Forger } from "@/lib/forge";
import { Upload, FileText, X } from "lucide-react";
import { useWatch, UseFormSetValue } from "react-hook-form";
import { getSimpleFileExtension, formatFileSize } from "@/lib/fileUtils.tsx";
import { useCallback } from "react";

interface VendorStep3FormProps {
  control: any;
  setValue: UseFormSetValue<any>;
}

function FileListItem({
  file,
  control,
  setValue,
}: {
  file: File;
  control: any;
  setValue: UseFormSetValue<any>;
}) {
  const value = useWatch({ control, name: "files" }) as File[] | undefined;
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getSimpleFileExtension(file.name).toUpperCase()} • {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          setValue(
            "files",
            (value ?? []).filter((v: File) => v.name !== file.name),
          )
        }
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function UploadElement() {
  return (
    <div className="text-center">
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Drag & Drop or Click to choose file
      </p>
      <p className="text-xs text-gray-400">
        Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
      </p>
    </div>
  );
}

const VendorStep3Form: React.FC<VendorStep3FormProps> = ({
  setValue,
  control,
}) => {
  // Lowercase identifier + useCallback keeps a stable renderer identity across
  // renders, so the module-scope FileListItem subtree isn't remounted each tick.
  const renderListItem = useCallback(
    (props: { file: File }) => (
      <FileListItem file={props.file} control={control} setValue={setValue} />
    ),
    [control, setValue],
  );
  return (
    <div className="space-y-4">
      <Forger
        name="files"
        component={TextFileUploader}
        label="Upload Files"
        element={<UploadElement />}
        List={renderListItem}
        containerClass="w-full"
        accept={
          {
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
            "application/zip": [".zip"],
            "image/png": [".png"],
            "image/jpeg": [".jpeg", ".jpg"],
          } as any
        }
        dropzoneOptions={{
          multiple: true,
          // maxFiles: 4,
        }}
      />
    </div>
  );
};

export default VendorStep3Form;
