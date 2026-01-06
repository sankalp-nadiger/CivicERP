
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image, Video } from "lucide-react";

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  acceptedTypes: string;
  maxFiles?: number;
  label: string;
  icon: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesChange, 
  acceptedTypes, 
  maxFiles = 3, 
  label, 
  icon 
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <input
          type="file"
          accept={acceptedTypes}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${label}`}
        />
        <label 
          htmlFor={`file-upload-${label}`}
          className="cursor-pointer flex flex-col items-center justify-center space-y-2"
        >
          {icon}
          <span className="text-sm text-gray-600">
            Click to upload {label.toLowerCase()} (Max {maxFiles} files)
          </span>
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <div className="flex items-center space-x-2">
                {file.type.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-blue-500" />
                ) : (
                  <Video className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
