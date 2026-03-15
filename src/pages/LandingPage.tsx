import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import LandingHero from "@/components/landing/LandingHero";

import LandingAppPreview from "@/components/landing/LandingAppPreview";
import LandingBenefits from "@/components/landing/LandingBenefits";
import LandingWhiteLabel from "@/components/landing/LandingWhiteLabel";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCommercialModel from "@/components/landing/LandingCommercialModel";
import LandingCRM from "@/components/landing/LandingCRM";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingNextStep from "@/components/landing/LandingNextStep";
import LandingFooter from "@/components/landing/LandingFooter";
import PlatformLogo from "@/components/PlatformLogo";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(220,30%,7%)] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[hsl(220,30%,7%)]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <PlatformLogo className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-lg hidden sm:inline text-white">Vale Resgate</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#modelo-comercial" className="hover:text-white transition-colors">Modelos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-6 bg-cyan-500 hover:bg-cyan-400 text-white border-0">
              <Link to="/trial">
                Começar Agora <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            {/* Mobile menu toggle */}
            <button className="md:hidden text-white/70" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[hsl(220,30%,9%)] border-t border-white/5 px-5 py-4 space-y-3">
            <a href="#como-funciona" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>Como Funciona</a>
            <a href="#beneficios" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>Benefícios</a>
            <a href="#modelo-comercial" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>Modelos</a>
            <a href="#faq" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link to="/auth" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>Entrar</Link>
          </div>
        )}
      </nav>

      <LandingHero />
      <LandingBenefits />
      <LandingAppPreview />
      <LandingHowItWorks />
      <LandingWhiteLabel />
      <LandingCommercialModel />
      <LandingCRM />
      <LandingTestimonials />
      <LandingFAQ />
      <LandingNextStep />
      <LandingFooter />
    </div>
  );
}
