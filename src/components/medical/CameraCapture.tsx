import { useState, useRef, useCallback, useEffect } from "react";
import { X, RefreshCw, Check } from "lucide-react";
import { Button } from "../core/Button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      setError("Cannot access camera. Please allow permissions.");
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCapturedBlob(blob);
              setCapturedPreview(URL.createObjectURL(blob));
              if (stream) {
                stream.getTracks().forEach((track) => track.stop());
              }
            }
          },
          "image/jpeg",
          0.9,
        );
      }
    }
  };

  const retakePhoto = () => {
    setCapturedBlob(null);
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(null);
    }
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], `scan-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      onCapture(file);
    }
  };

  return (
    <div className="w-full flex justify-center items-center overflow-hidden bg-slate-900 rounded-xl relative aspect-video">
      {!capturedPreview ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white bg-slate-900/80">
              <p>{error}</p>
            </div>
          )}

          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 bg-slate-900/50 hover:bg-slate-900/80 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-6 inset-x-0 flex justify-center">
            <button
              onClick={takePhoto}
              className="h-16 w-16 bg-white/20 hover:bg-white/40 ring-4 ring-white rounded-full flex items-center justify-center transition-all"
            >
              <div className="h-12 w-12 bg-white rounded-full"></div>
            </button>
          </div>
        </>
      ) : (
        <>
          <img
            src={capturedPreview}
            alt="Captured scan"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={retakePhoto}
              className="border-white text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmPhoto}
              className="bg-primary-600 hover:bg-primary-500 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Use Photo
            </Button>
          </div>
        </>
      )}

      {/* Hidden working canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
