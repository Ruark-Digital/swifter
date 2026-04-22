import { ReactNode } from "react";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
} from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Accept } from "react-dropzone";

export type TextFileProps = {
  label?: string | JSX.Element;
  containerClass?: string;
  error?: string;
  className?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  helperText?: string;
  files?: File[] | null;
  value?: File[] | null;
  onChange?: (value: File[] | null) => void;
  element: JSX.Element;
  List: ({
    file,
    control,
    index,
  }: {
    file: File;
    control: any;
    index?: number;
  }) => JSX.Element;
  accept?: Accept;
  control?: any,
  dropzoneOptions?: Record<string, any>
};

// Create a modified version of the FileUploader with fixed types
function SafeFileUploader(props: any) {
  return <FileUploader {...props} />;
}

export const TextFileUploader = ({
  value,
  onChange,
  element,
  containerClass,
  error,
  List,
  label,
  className,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  },
  ...props
}: TextFileProps) => {
  const dropZoneConfig = {
    multiple: true,
    maxFiles: 10000000000000000000000000,
    accept,
    ...props.dropzoneOptions
  };
  

  // Force TypeScript to treat this as the correct function signature
  // by using a wrapper function with explicit type assertion
  const onValueChangeWrapper = (files: File[] | null | undefined) => {
    // Convert undefined to null to satisfy the callback type
    const safeFiles = files === undefined ? null : files;
    // Only call onChange if it exists
    onChange?.(safeFiles);
  };

  // Force TypeScript to accept our implementation
  const typedValueChange = onValueChangeWrapper as (
    files: File[] | null
  ) => void;

  return (
    <div className={cn("", containerClass)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Label>
      )}
      <SafeFileUploader
        {...props}
        value={value}
        onValueChange={typedValueChange}
        dropzoneOptions={dropZoneConfig}
        // reSelect={true}
        className={cn(
          "relative rounded-lg border-0",
          className
        )}
      >
        <FileInput className="min-h-40 bg-accent/5 hover:bg-accent/10 transition-colors duration-200">
          <div className="flex items-center justify-center h-40 flex-col w-full">
            {element}
          </div>
        </FileInput>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}

        <FileUploaderContent>
          {value &&
            value.length > 0 &&
            value?.map?.((file, i) => (
              <List key={i} file={file} control={props.control} index={i} />
            ))}
        </FileUploaderContent>
      </SafeFileUploader>
    </div>
  );
};
// <FileUploaderItem key={i} index={i}>
{
  /* <Paperclip className="h-4 w-4 stroke-current" />
<span>{file.name}</span>
</FileUploaderItem> */
}
//
