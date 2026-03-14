import { ScrollExpansionHero } from "./scroll-expansion-hero";
import { Button } from "../core/Button";
import { ArrowRight, Shield, Heart, Activity } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroDemo() {
  return (
    <ScrollExpansionHero
      backgroundImageUrl="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      badge={
        <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-800 px-3 py-1.5 rounded-full text-sm font-semibold border border-primary-200 shadow-sm">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>AI-Assisted Skin Screening</span>
        </div>
      }
      title={
        <>
          Understand Your <span className="text-primary-600">Skin Health</span>{" "}
          Instantly
        </>
      }
      subtitle="Upload a photo, receive an AI-powered risk screening, and connect with certified dermatologists if needed."
      actionButtons={
        <>
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto hover:scale-105 transition-transform shadow-md"
            >
              Start Free Screening <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 shadow-sm border-slate-200"
            >
              Learn How It Works
            </Button>
          </a>
        </>
      }
    >
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-white font-semibold drop-shadow-md absolute bottom-6 w-full justify-center">
        <div className="flex items-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm shadow-xl">
          <Shield className="w-4 h-4 mr-2 text-emerald-400" /> HIPAA Compliant
        </div>
        <div className="flex items-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm shadow-xl">
          <Heart className="w-4 h-4 mr-2 text-red-400" /> No Data Sold
        </div>
      </div>
    </ScrollExpansionHero>
  );
}
