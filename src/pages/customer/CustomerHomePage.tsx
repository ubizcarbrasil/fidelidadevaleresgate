import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Loader2, Star } from "lucide-react";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerHomePage() {
  const { customer, loading } = useCustomer();
  const { theme } = useBrand();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      {loading ? (
        <div className="max-w-lg mx-auto px-4 pt-6">
          <div className="rounded-2xl p-6 flex items-center justify-center" style={{ backgroundColor: primary }}>
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        </div>
      ) : customer ? (
        <div className="max-w-lg mx-auto px-4 pt-6">
          <div
            className="rounded-2xl p-5 text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}
          >
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">Seu saldo</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ fontFamily: fontHeading }}>
                {Number(customer.points_balance).toLocaleString("pt-BR")}
              </span>
              <span className="text-sm opacity-70">pontos</span>
            </div>
            {Number(customer.money_balance) > 0 && (
              <p className="text-sm mt-1 opacity-70">
                R$ {Number(customer.money_balance).toFixed(2)} disponível
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Dynamic Sections */}
      <HomeSectionsRenderer />

      {/* Slogan / Footer text */}
      {theme?.footer_text && (
        <div className="text-center py-4 text-xs opacity-40 px-4">
          {theme.footer_text}
        </div>
      )}
    </div>
  );
}
