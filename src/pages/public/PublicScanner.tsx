import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PublicNavbar } from "../../components/shared/PublicNavbar";
import { Button } from "../../components/core/Button";
import {
  UploadCloud,
  Lock,
  Activity,
  AlertTriangle,
  ArrowRight,
  Camera,
} from "lucide-react";
import { CameraCapture } from "../../components/medical/CameraCapture";
import { ScanningAnimation } from "../../components/shared/ScanningAnimation";

export function PublicScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setScanComplete(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setScanComplete(false);
    }
  };

  const simulateScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanError(null);

    // Start a fake progress bar just for UX feel
    const interval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 5 : prev));
    }, 200);

    try {
      // 1. Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Image = await base64Promise;

      // 2. Call real public API
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/v1/public/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image,
          mimeType: file.type,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Failed to analyze image.");
      }

      const result = await res.json();
      setScanResult(result.data);

      clearInterval(interval);
      setScanProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      setScanError(err.message || "An unexpected error occurred.");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex flex-col items-center pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-primary-100 text-primary-800 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-primary-200"
          >
            <Activity className="w-4 h-4 text-primary-600 animate-pulse" />
            <span>Instant Anonymous Skin Check</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-6"
          >
            See What Our <span className="text-primary-600">Clinical AI</span>{" "}
            Observes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-medium"
          >
            Upload a photo of a skin concern to see how our triage algorithm
            analyzes it. No account required to try the scanner.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 px-8 py-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <ScanIcon className="w-6 h-6 text-primary-400" />
              <span className="font-bold tracking-wide">
                SkinHealth Engine v2.1
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-white/10 rounded-full border border-white/20">
              <Lock className="w-3 h-3 text-emerald-400" /> Local Processing
            </div>
          </div>

          <div className="p-8 lg:p-12">
            {!previewUrl ? (
              useCamera ? (
                <div className="max-w-md mx-auto">
                  <CameraCapture
                    onCapture={(capturedFile) => {
                      setFile(capturedFile);
                      setPreviewUrl(URL.createObjectURL(capturedFile));
                      setScanComplete(false);
                      setUseCamera(false);
                    }}
                    onClose={() => setUseCamera(false)}
                  />
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-slate-200 hover:border-primary-400 bg-slate-50 hover:bg-primary-50 transition-colors rounded-2xl flex flex-col items-center justify-center p-16 cursor-pointer group h-80"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-10 h-10 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Drop your skin photo here
                  </h3>
                  <p className="text-slate-500 font-medium mb-6 text-center max-w-sm">
                    Supports JPG, PNG, and HEIC up to 10MB. Images are analyzed
                    locally and not saved.
                  </p>
                  <div
                    className="flex gap-3 relative z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      className="bg-white pointer-events-none"
                    >
                      Browse Files
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white hover:bg-slate-50 text-slate-700"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUseCamera(true);
                      }}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    className="hidden"
                  />
                </div>
              )
            ) : (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Image Preview Window */}
                <div className="w-full md:w-1/2">
                  <ScanningAnimation
                    imageUrl={previewUrl}
                    isScanning={isScanning}
                    scanProgress={scanProgress}
                    scanComplete={scanComplete}
                    statusText={
                      isScanning ? "Processing mapping layers" : undefined
                    }
                    boundingBox={scanResult?.bounding_box}
                  />
                </div>

                {/* Status Window */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  {!isScanning && !scanComplete ? (
                    <div className="space-y-6">
                      {scanError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start text-sm">
                          <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                          <div>
                            <p className="font-bold">Analysis Failed</p>
                            <p>{scanError}</p>
                          </div>
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-slate-900">
                        Image Loaded
                      </h3>
                      <p className="text-slate-600 font-medium">
                        The AI is ready to map morphological features, border
                        irregularity, and pigment network structures.
                      </p>
                      <Button
                        size="lg"
                        onClick={simulateScan}
                        className="w-full shadow-lg text-lg h-14 rounded-xl"
                      >
                        <Activity className="w-5 h-5 mr-2" /> Start Analysis
                      </Button>
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setScanResult(null);
                          setScanError(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 text-sm font-semibold w-full text-center"
                      >
                        Use a different photo
                      </button>
                    </div>
                  ) : isScanning ? (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                        <LoaderIcon className="w-6 h-6 mr-3 animate-spin text-primary-600" />
                        Analyzing...
                      </h3>

                      <div className="space-y-4">
                        <div className="flex justify-between text-sm font-semibold text-slate-500">
                          <span>Processing mapping layers</span>
                          <span>{scanProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all duration-150 ease-out"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                      </div>

                      <ul className="space-y-3 mt-6">
                        {[
                          {
                            threshold: 10,
                            label: "Extracting morphological features...",
                          },
                          {
                            threshold: 40,
                            label: "Evaluating border asymmetry...",
                          },
                          {
                            threshold: 70,
                            label: "Drawing clinical bounding box...",
                          },
                        ].map((step, i) => (
                          <li
                            key={i}
                            className={`flex items-center text-sm font-medium ${scanProgress >= step.threshold ? "text-primary-700" : "text-slate-400"}`}
                          >
                            {scanProgress >= step.threshold + 20 ? (
                              <svg
                                className="w-4 h-4 mr-2 text-emerald-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            ) : (
                              <div
                                className={`w-4 h-4 mr-2 rounded-full border-2 ${scanProgress >= step.threshold ? "border-primary-500 border-t-transparent animate-spin" : "border-slate-300"}`}
                              />
                            )}
                            {step.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-bold border border-amber-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Analysis Complete</span>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900">
                        Visual Patterns Detected
                      </h3>

                      <p className="text-slate-600 font-medium leading-relaxed">
                        The AI has identified specific structural
                        characteristics in your image that warrant a formal risk
                        calculation and potential doctor review.
                      </p>

                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative overflow-hidden group">
                        {/* Blur overlay requiring login */}
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center p-6 text-center border border-slate-200/50">
                          <Lock className="w-8 h-8 text-primary-600 mb-3" />
                          <h4 className="font-bold text-slate-900 mb-1">
                            Sign in to view full report
                          </h4>
                          <p className="text-xs text-slate-600 mb-4 font-medium">
                            To comply with privacy laws, medical results require
                            a secure account.
                          </p>
                          <Link to="/register" className="w-full">
                            <Button className="w-full shadow-md">
                              Create Free Account{" "}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>

                        {/* Blurred fake content underneath */}
                        <div className="space-y-3 opacity-40 select-none">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="font-bold text-slate-700">
                              AI Priority Risk
                            </span>
                            <span
                              className={`font-bold ${
                                scanResult?.risk_level === "CRITICAL" ||
                                scanResult?.risk_level === "HIGH"
                                  ? "text-red-600"
                                  : scanResult?.risk_level === "MODERATE"
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                              }`}
                            >
                              {scanResult?.risk_level || "MODERATE RISK"}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-slate-500">
                            Confidence:{" "}
                            {(scanResult?.confidence * 100).toFixed(1)}% |
                            Severity: {scanResult?.severity_score}/10
                          </div>
                          <div className="h-4 bg-slate-200 rounded w-full" />
                          <div className="h-4 bg-slate-200 rounded w-5/6" />
                          <div className="h-4 bg-slate-200 rounded w-4/6" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function ScanIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M11.99 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7" />
    </svg>
  );
}

function LoaderIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="6" />
      <line x1="12" x2="12" y1="18" y2="22" />
      <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
      <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
      <line x1="2" x2="6" y1="12" y2="12" />
      <line x1="18" x2="22" y1="12" y2="12" />
      <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
      <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
    </svg>
  );
}
