import { Shield, Activity } from "lucide-react";
import { Card, CardContent } from "../core/Card";

export function RealTimeShield({
  progress = 0,
  status = "Initiating Secure Connection...",
}) {
  return (
    <Card className="w-full max-w-md mx-auto border-primary-200 overflow-hidden">
      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full bg-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <CardContent className="p-8 text-center flex flex-col items-center">
        <div className="relative mb-6 mt-4">
          <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75" />
          <div className="relative bg-white rounded-full p-6 border border-primary-100 shadow-sm">
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Analyzing secure image
        </h3>
        <p className="text-sm text-slate-500 mb-8">{status}</p>

        <div className="flex items-center text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full font-medium">
          <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
          AI Engine Active
        </div>
      </CardContent>
    </Card>
  );
}
