import { Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";

interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

interface ScanningAnimationProps {
  imageUrl: string;
  isScanning: boolean;
  scanProgress: number;
  scanComplete: boolean;
  statusText?: string;
  boundingBox?: BoundingBox | null;
}

export function ScanningAnimation({
  imageUrl,
  isScanning,
  scanProgress,
  scanComplete,
  statusText,
  boundingBox,
}: ScanningAnimationProps) {
  // Convert 0-1000 scale to percentage for CSS
  const getBoxStyle = (box: BoundingBox) => {
    const top = `${(box.ymin / 1000) * 100}%`;
    const left = `${(box.xmin / 1000) * 100}%`;
    const height = `${((box.ymax - box.ymin) / 1000) * 100}%`;
    const width = `${((box.xmax - box.xmin) / 1000) * 100}%`;
    return { top, left, height, width };
  };

  return (
    <div className="w-full relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square shadow-inner">
      <img
        src={imageUrl}
        alt="Skin preview"
        className="w-full h-full object-cover"
      />

      {isScanning && (
        <div className="absolute inset-0 z-10">
          <div
            className="w-full h-1 bg-primary-500 shadow-[0_0_15px_rgba(14,165,233,0.8)] absolute left-0 transition-all duration-100 ease-linear"
            style={{ top: `${scanProgress}%` }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-primary-900/40 backdrop-blur-[2px] transition-all duration-100"
            style={{ top: `${scanProgress}%` }}
          />
        </div>
      )}

      {scanComplete && !boundingBox && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 border-4 border-amber-400 z-20 flex items-center justify-center bg-black/30 pointer-events-none"
        >
          <div className="w-24 h-24 border-2 border-amber-400 border-dashed rounded-full" />
        </motion.div>
      )}

      {scanComplete && boundingBox && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-20 pointer-events-none"
          style={getBoxStyle(boundingBox)}
        >
          {/* Inner transparent box with solid border */}
          <div className="w-full h-full border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] relative">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-500" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-500" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-500" />

            {/* Label */}
            <div className="absolute -top-6 text-white text-[10px] font-mono tracking-wider bg-red-500/90 px-2 py-0.5 rounded-sm whitespace-nowrap">
              Primary Anomaly
            </div>
          </div>
        </motion.div>
      )}

      {/* Optional HUD text overlay */}
      {statusText && (
        <div className="absolute bottom-6 inset-x-6 z-30">
          <div className="bg-slate-950/80 backdrop-blur-md border border-primary-500/30 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Activity className="w-4 h-4 text-primary-400 mr-2 animate-bounce" />
              <span className="text-primary-300 text-xs font-mono font-semibold tracking-wider uppercase">
                Neural Processing
              </span>
            </div>
            <p className="text-white text-sm font-medium animate-pulse">
              {statusText}
            </p>

            {isScanning && (
              <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary-500 h-full transition-all duration-150"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cyberpunk Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] z-0 pointer-events-none mix-blend-multiply" />

      {/* Data Source overlays */}
      <div className="absolute top-4 right-6 z-30 flex flex-col items-end gap-1 opacity-70">
        <div className="flex items-center text-primary-400 text-[10px] font-mono tracking-widest drop-shadow-md">
          <Cpu className="w-3 h-3 mr-1 animate-pulse" />
          GEMINI VISION-FLASH
        </div>
      </div>
    </div>
  );
}
