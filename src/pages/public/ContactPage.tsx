import { PublicNavbar } from "../../components/shared/PublicNavbar";
import { Mail, MapPin, Phone, AlertTriangle } from "lucide-react";
import { Button } from "../../components/core/Button";
import { Link } from "react-router-dom";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <PublicNavbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 text-center">
          Contact SkinHealth
        </h1>
        <p className="text-lg text-slate-600 mb-4 text-center max-w-2xl mx-auto">
          Our support team is available to assist with platform access,
          technical issues, and general inquiries about the service.
        </p>

        {/* Emergency notice */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-10 flex items-start gap-3 max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm font-medium">
            <strong>Medical emergency?</strong> Do not use this contact form.
            Call <strong>911</strong> or go to your nearest emergency department
            immediately.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Send a Message
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              For platform support, billing questions, or partnership enquiries.
              We respond within 1–2 business days.
            </p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <select className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none text-slate-700">
                  <option>Technical support</option>
                  <option>Account access</option>
                  <option>Doctor or clinician enquiry</option>
                  <option>Privacy or data request</option>
                  <option>General question</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Describe your question or issue..."
                ></textarea>
              </div>
              <Button className="w-full">Submit Inquiry</Button>
              <p className="text-xs text-slate-400 text-center">
                Please do not include sensitive medical information in this
                form. Use the secure in-app messaging to communicate with your
                assigned doctor.
              </p>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-start space-x-4">
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Email Support</h3>
                <p className="text-slate-600">support@skinhealth.example.com</p>
                <p className="text-sm text-slate-400 mt-1">
                  Response within 1–2 business days
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-start space-x-4">
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Phone Support</h3>
                <p className="text-slate-600">+1 (800) 555-SKIN</p>
                <p className="text-sm text-slate-400 mt-1">
                  Mon–Fri, 9 am–5 pm EST
                </p>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Not for medical emergencies — call 911
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-start space-x-4">
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Headquarters</h3>
                <p className="text-slate-600">123 Medical Innovation Drive</p>
                <p className="text-slate-600">Boston, MA 02115, USA</p>
              </div>
            </div>

            {/* Privacy note */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                For data access, deletion requests, or privacy concerns under
                HIPAA or GDPR, please email{" "}
                <span className="text-primary-600 font-medium">
                  privacy@skinhealth.example.com
                </span>{" "}
                directly. We aim to respond to all privacy requests within 14
                business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200">
        <Link to="/" className="hover:text-primary-500 transition-colors">
          ← Back to SkinHealth
        </Link>
      </footer>
    </div>
  );
}
