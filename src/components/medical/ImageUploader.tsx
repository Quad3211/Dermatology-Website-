import React, { useCallback, useState } from "react";
import {
  UploadCloud,
  AlertCircle,
  X,
  Image as ImageIcon,
  ShieldCheck,
  Camera
} from "lucide-react";
import { Button } from "../core/Button";
import { cn } from "../../utils/cn";
import { CameraCapture } from "./CameraCapture";

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function ImageUploader({ onUpload, isUploading }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [useCamera, setUseCamera] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const validateFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return "Please select a valid image file (JPG, PNG).";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "Image must be smaller than 10MB.";
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setError("");
        setSelectedFile(file);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setError("");
        setSelectedFile(file);
      }
    }
  };

  const submitUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
    } catch (err: any) {
      setError(err.message || "Failed to upload image securely.");
    }
  };

  return (
    <div className="w-full">
      {useCamera ? (
        <CameraCapture 
            onCapture={(file) => {
              setSelectedFile(file);
              setUseCamera(false);
            }} 
            onClose={() => setUseCamera(false)} 
        />
      ) : !selectedFile ? (
        <div className="w-full flex flex-col items-center">
            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-surface-muted",
                dragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-300 hover:bg-slate-50",
                error && "border-status-danger bg-red-50",
              )}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <UploadCloud
                  className={cn(
                    "w-12 h-12 mb-4",
                    dragActive ? "text-primary-500" : "text-slate-400",
                  )}
                />
                <p className="mb-2 text-sm text-slate-700">
                  <span className="font-semibold text-primary-600">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  Secure JPEG, PNG (MAX. 10MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleChange}
              />
            </label>
            
            <div className="mt-4 flex items-center justify-center">
                <span className="text-slate-400 text-sm mr-4">or</span>
                <Button variant="outline" onClick={() => setUseCamera(true)}>
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                </Button>
            </div>
        </div>
      ) : (
        <div className="w-full rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="flex-shrink-0 h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-slate-900 truncate pr-4">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 text-slate-400 hover:text-status-danger transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitUpload}
              isLoading={isUploading}
              className="px-6"
            >
              Analyze Securely
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center text-sm text-status-danger bg-red-50 p-3 rounded-lg border border-red-100">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <div className="mt-6 flex items-start text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 mr-1.5 flex-shrink-0 text-status-safe" />
        <p>
          Your uploaded image is encrypted and processed via temporary signed
          URLs. It will be automatically deleted after your specified retention
          period.
        </p>
      </div>
    </div>
  );
}
