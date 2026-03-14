import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import { Shield, Bell, User } from "lucide-react";

export function DoctorSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in p-8 bg-surface-muted min-h-[calc(100vh-64px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Clinical Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your professional profile, notification preferences, and
          security.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-slate-50 border-b border-surface-border">
            <CardTitle className="text-slate-800 flex items-center text-lg">
              <User className="mr-3 h-5 w-5 text-primary-600" />
              Professional Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Display Name
                </label>
                <input
                  type="text"
                  disabled
                  value="Dr. Smith"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Medical License Number
                </label>
                <input
                  type="text"
                  disabled
                  value="MD-****893"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed text-sm"
                />
              </div>
              <Button disabled variant="outline" className="mt-4">
                Request Profile Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-slate-50 border-b border-surface-border">
            <CardTitle className="text-slate-800 flex items-center text-lg">
              <Bell className="mr-3 h-5 w-5 text-primary-600" />
              Notification Routing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">
                    High Risk Priority Alerts
                  </h4>
                  <p className="text-sm text-slate-500">
                    Immediate SMS and Email for &gt;85% AI confidence cases.
                  </p>
                </div>
                <div className="w-12 h-6 bg-primary-600 rounded-full flex items-center p-1 justify-end cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                <div>
                  <h4 className="font-medium text-slate-900">
                    Standard Queue Updates
                  </h4>
                  <p className="text-sm text-slate-500">
                    Daily digest of new moderate and low risk triages.
                  </p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full flex items-center p-1 justify-start cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-slate-50 border-b border-surface-border">
            <CardTitle className="text-slate-800 flex items-center text-lg">
              <Shield className="mr-3 h-5 w-5 text-status-safe" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-slate-900">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-slate-500">
                  Required by HIPAA compliance policy.
                </p>
              </div>
              <span className="bg-green-100 text-status-safe px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Enabled
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
