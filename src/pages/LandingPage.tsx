import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import LandingHero from "@/components/landing/LandingHero";
import LandingPainPoints from "@/components/landing/LandingPainPoints";
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/logo-vale-resgate.jpeg" alt="Vale Resgate" className="h-9 w-auto rounded-lg" />
            <span className="font-bold text-lg hidden sm:inline">Vale Resgate</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a>
            <a href="#para-quem" className="hover:text-primary transition-colors">Para Quem É?</a>
            <a href="#modelo-comercial" className="hover:text-primary transition-colors">Modelo Comercial</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#proximo-passo" className="hover:text-primary transition-colors">Próximo Passo</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/trial">
                Começar Agora <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <LandingHero />
      <LandingPainPoints />
      <LandingAppPreview />
      <LandingBenefits />
      <LandingTestimonials />
      <LandingHowItWorks />
      <LandingCommercialModel />
      <LandingFAQ />
      <LandingNextStep />
      <LandingFooter />
    </div>
  );
}
