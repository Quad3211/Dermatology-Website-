import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/layout/AuthLayout";
import { DoctorLayout } from "./components/layout/DoctorLayout";
import { PatientLayout } from "./components/layout/PatientLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { SessionWatcher } from "./components/shared/SessionWatcher";
import { DoctorLogin } from "./pages/auth/DoctorLogin";
import { DoctorRegister } from "./pages/auth/DoctorRegister";
import { PatientLogin } from "./pages/auth/PatientLogin";
import { PatientRegister } from "./pages/auth/PatientRegister";
import { DoctorSettings } from "./pages/doctor/DoctorSettings";
import { PatientList } from "./pages/doctor/PatientList";
import { ReviewPortal } from "./pages/doctor/ReviewPortal";
import { ConsultationBooking } from "./pages/patient/ConsultationBooking";
import { Dashboard } from "./pages/patient/Dashboard";
import { EducationView } from "./pages/patient/EducationView";
import { LandingPage } from "./pages/patient/LandingPage";
import { ScanHistory } from "./pages/patient/ScanHistory";
import { UploadFlow } from "./pages/patient/UploadFlow";
import { AboutPage } from "./pages/public/AboutPage";
import { ContactPage } from "./pages/public/ContactPage";
import {
  MedicalDisclaimer,
  PrivacyPolicy,
  TermsOfUse,
} from "./pages/public/LegalPages";
import { PublicScanner } from "./pages/public/PublicScanner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* session timeout watcher */}
        <SessionWatcher />

        <Routes>
          {/* auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PatientLogin />} />
            <Route path="/register" element={<PatientRegister />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />
          </Route>

          {/* patient routes */}
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route element={<PatientLayout />}>
              <Route path="/patient" element={<Dashboard />} />
              <Route path="/patient/upload" element={<UploadFlow />} />
              <Route path="/patient/education" element={<EducationView />} />
              <Route
                path="/patient/consultation"
                element={<ConsultationBooking />}
              />
              <Route path="/patient/history" element={<ScanHistory />} />
            </Route>
          </Route>

          {/* doctor routes */}
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route element={<DoctorLayout />}>
              <Route path="/doctor" element={<ReviewPortal />} />
              <Route path="/doctor/patients" element={<PatientList />} />
              <Route path="/doctor/settings" element={<DoctorSettings />} />
            </Route>
          </Route>

          {/* public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/scan" element={<PublicScanner />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/disclaimer" element={<MedicalDisclaimer />} />
          <Route path="/terms" element={<TermsOfUse />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
