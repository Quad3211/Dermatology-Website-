import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import type { Location } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionWatcher } from "./components/shared/SessionWatcher";

const queryClient = new QueryClient();

const lazyNamed = (factory: () => Promise<any>, name: string) =>
  lazy(async () => {
    const module = await factory();
    return { default: module[name] };
  });

const AuthLayout = lazyNamed(
  () => import("./components/layout/AuthLayout"),
  "AuthLayout",
);
const AuthModalLayout = lazyNamed(
  () => import("./components/layout/AuthModalLayout"),
  "AuthModalLayout",
);
const ProtectedRoute = lazyNamed(
  () => import("./components/layout/ProtectedRoute"),
  "ProtectedRoute",
);
const PatientLayout = lazyNamed(
  () => import("./components/layout/PatientLayout"),
  "PatientLayout",
);
const DoctorLayout = lazyNamed(
  () => import("./components/layout/DoctorLayout"),
  "DoctorLayout",
);

const PatientLogin = lazyNamed(
  () => import("./pages/auth/PatientLogin"),
  "PatientLogin",
);
const PatientRegister = lazyNamed(
  () => import("./pages/auth/PatientRegister"),
  "PatientRegister",
);
const DoctorLogin = lazyNamed(
  () => import("./pages/auth/DoctorLogin"),
  "DoctorLogin",
);
const DoctorRegister = lazyNamed(
  () => import("./pages/auth/DoctorRegister"),
  "DoctorRegister",
);

const Dashboard = lazyNamed(
  () => import("./pages/patient/Dashboard"),
  "Dashboard",
);
const UploadFlow = lazyNamed(
  () => import("./pages/patient/UploadFlow"),
  "UploadFlow",
);
const EducationView = lazyNamed(
  () => import("./pages/patient/EducationView"),
  "EducationView",
);
const ConsultationBooking = lazyNamed(
  () => import("./pages/patient/ConsultationBooking"),
  "ConsultationBooking",
);
const ScanHistory = lazyNamed(
  () => import("./pages/patient/ScanHistory"),
  "ScanHistory",
);

const ReviewPortal = lazyNamed(
  () => import("./pages/doctor/ReviewPortal"),
  "ReviewPortal",
);
const PatientList = lazyNamed(
  () => import("./pages/doctor/PatientList"),
  "PatientList",
);
const DoctorSettings = lazyNamed(
  () => import("./pages/doctor/DoctorSettings"),
  "DoctorSettings",
);

const LandingPage = lazyNamed(
  () => import("./pages/patient/LandingPage"),
  "LandingPage",
);
const PrivacyPolicy = lazyNamed(
  () => import("./pages/public/LegalPages"),
  "PrivacyPolicy",
);
const MedicalDisclaimer = lazyNamed(
  () => import("./pages/public/LegalPages"),
  "MedicalDisclaimer",
);
const TermsOfUse = lazyNamed(
  () => import("./pages/public/LegalPages"),
  "TermsOfUse",
);
const ContactPage = lazyNamed(
  () => import("./pages/public/ContactPage"),
  "ContactPage",
);
const AboutPage = lazyNamed(
  () => import("./pages/public/AboutPage"),
  "AboutPage",
);
const PublicScanner = lazyNamed(
  () => import("./pages/public/PublicScanner"),
  "PublicScanner",
);

function AppRoutes() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
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

      {state?.backgroundLocation && (
        <Routes>
          <Route element={<AuthModalLayout />}>
            <Route path="/login" element={<PatientLogin />} />
            <Route path="/register" element={<PatientRegister />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* session timeout watcher */}
        <SessionWatcher />

        <Suspense
          fallback={
            <div className="min-h-[100dvh] flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
