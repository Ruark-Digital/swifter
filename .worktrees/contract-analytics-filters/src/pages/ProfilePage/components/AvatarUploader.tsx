import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FileUploader, FileInput } from "@/components/ui/file-upload";
import { Camera } from "lucide-react";

interface AvatarUploaderProps {
  currentImage?: string;
  selectedFiles: File[] | null;
  onFilesChange: (files: File[] | null) => void;
  fallbackText: string;
  size?: 'small' | 'large';
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentImage,
  selectedFiles,
  onFilesChange,
  fallbackText,
  size = 'large',
}) => {
  const isSmall = size === 'small';
  const avatarSize = isSmall ? 'w-20 h-20' : 'w-36 h-36';
  const cameraSize = isSmall ? 'w-6 h-6' : 'w-8 h-8';
  const fallbackTextSize = isSmall ? 'text-2xl' : 'text-6xl';
  const borderClass = isSmall ? 'border-2 border-gray-200 dark:border-gray-700' : 'border-4 border-white dark:border-gray-600';

  return (
    <div className="flex-shrink-0 relative">
      <Avatar className={`${avatarSize} ${borderClass}`}>
        <AvatarImage
          src={
            selectedFiles?.[0]
              ? URL.createObjectURL(selectedFiles[0])
              : currentImage
          }
          alt={isSmall ? "Company logo" : "Profile avatar"}
          className={isSmall ? "w-full h-full object-cover" : ""}
        />
        <AvatarFallback className={`bg-gray-300 dark:bg-gray-700 ${fallbackTextSize} font-semibold text-gray-600 dark:text-gray-300`}>
          {fallbackText}
        </AvatarFallback>
      </Avatar>

      {/* Upload overlay */}
      <FileUploader
        value={selectedFiles}
        onValueChange={onFilesChange}
        dropzoneOptions={{
          accept: {
            "image/*": [".jpg", ".jpeg", ".png"],
          },
          maxFiles: 1,
          maxSize: 4 * 1024 * 1024, // 4MB
          multiple: false,
        }}
        className="absolute inset-0"
      >
        <FileInput className="w-full h-full">
          <div className="absolute inset-0 bg-black/30 bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center group cursor-pointer">
            <Camera className={`${cameraSize} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
          </div>
        </FileInput>
      </FileUploader>
    </div>
  );
};

export default AvatarUploader;