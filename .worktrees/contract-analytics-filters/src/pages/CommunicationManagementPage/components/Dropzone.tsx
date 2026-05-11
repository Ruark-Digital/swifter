import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

export const DropzoneArea = ({ onFileSelect, disabled }: {
  onFileSelect: (files: FileList) => void;
  disabled: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled || !e.dataTransfer.files) return;
    
    onFileSelect(e.dataTransfer.files);
  }, [disabled, onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileSelect(e.target.files);
    }
  }, [onFileSelect]);

  return (
    <div
      className={cn
        (
        "relative rounded-lg border-2 border-dashed bg-amber-400 transition-all duration-200 min-h-40 flex items-center justify-center cursor-pointer",
        disabled 
          ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50" 
          : isDragOver 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="text-center">
        <svg
          className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400 mx-auto"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 16"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
          />
        </svg>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-primary">
            {disabled ? "Uploading files..." : "Drag & Drop or Click to choose file"}
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supported formats: PNG, JPEG
        </p>
      </div>
    </div>
  );
};