import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionWatcher } from "./components/shared/SessionWatcher";
import { AuthLayout } from "./components/layout/AuthLayout";
import { PatientLogin } from "./pages/auth/PatientLogin";
import { PatientRegister } from "./pages/auth/PatientRegister";
import { DoctorLogin } from "./pages/auth/DoctorLogin";
import { DoctorRegister } from "./pages/auth/DoctorRegister";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { PatientLayout } from "./components/layout/PatientLayout";
import { Dashboard } from "./pages/patient/Dashboard";
import { UploadFlow } from "./pages/patient/UploadFlow";
import { EducationView } from "./pages/patient/EducationView";
import { ConsultationBooking } from "./pages/patient/ConsultationBooking";
import { ScanHistory } from "./pages/patient/ScanHistory";
import { DoctorLayout } from "./components/layout/DoctorLayout";
import { ReviewPortal } from "./pages/doctor/ReviewPortal";
import { PatientList } from "./pages/doctor/PatientList";
import { DoctorSettings } from "./pages/doctor/DoctorSettings";
import { LandingPage } from "./pages/patient/LandingPage";
import {
  PrivacyPolicy,
  MedicalDisclaimer,
  TermsOfUse,
} from "./pages/public/LegalPages";
import { ContactPage } from "./pages/public/ContactPage";
import { AboutPage } from "./pages/public/AboutPage";
import { PublicScanner } from "./pages/public/PublicScanner";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Enforce inactivity logout globally inside routing context */}
        <SessionWatcher />

        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PatientLogin />} />
            <Route path="/register" element={<PatientRegister />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />
          </Route>

          {/* Secure Patient Routing */}
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

          {/* Secure Doctor Routing */}
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route element={<DoctorLayout />}>
              <Route path="/doctor" element={<ReviewPortal />} />
              <Route path="/doctor/patients" element={<PatientList />} />
              <Route path="/doctor/settings" element={<DoctorSettings />} />
            </Route>
          </Route>

          {/* Public Landing Page */}
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
