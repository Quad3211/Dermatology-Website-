import { useState } from "react";
import { User, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../core/Card";
import { cn } from "../../utils/cn";

const BODY_REGIONS = [
  { id: "head", label: "Head & Neck" },
  { id: "torso_front", label: "Torso (Front)" },
  { id: "torso_back", label: "Torso (Back)" },
  { id: "arms", label: "Arms & Hands" },
  { id: "legs", label: "Legs & Feet" },
];

export function SkinBodyMap({
  onRegionSelect,
}: {
  onRegionSelect?: (regionId: string) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedRegion(id);
    if (onRegionSelect) onRegionSelect(id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-slate-800 flex items-center">
          <User className="mr-2 h-5 w-5 text-primary-600" />
          Select Lesion Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            {BODY_REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleSelect(region.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between",
                  selectedRegion === region.id
                    ? "bg-primary-50 border-primary-500 text-primary-700 font-medium cursor-default"
                    : "bg-white border-surface-border text-slate-600 hover:bg-slate-50 cursor-pointer",
                )}
              >
                {region.label}
                {selectedRegion === region.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary-600" />
                )}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center justify-center bg-surface-muted rounded-lg border border-surface-border p-6 min-h-[300px]">
            {/* A stylized placeholder for an actual 3D body map or SVG */}
            <div className="text-center text-slate-400">
              <User className="w-32 h-32 mx-auto text-slate-300 mb-4 opacity-50" />
              <p className="text-sm font-medium">Topographic Render View</p>
              <p className="text-xs mt-1 text-slate-500">
                Region:{" "}
                {selectedRegion ? (
                  <span className="text-primary-600 font-medium">
                    {BODY_REGIONS.find((r) => r.id === selectedRegion)?.label}
                  </span>
                ) : (
                  "None selected"
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
