import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Save, Loader2, User, ChevronRight, MapPin, Shield, HelpCircle, Heart, Tag, Moon, Sun } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { translateError } from "@/lib/translateError";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

const sectionVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function CustomerProfilePage() {
  const { user, signOut } = useAuth();
  const { customer, refetch } = useCustomer();
  const { theme, branches, selectedBranch, setSelectedBranch } = useBrand();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("customers").update({ name, phone }).eq("id", customer.id);
      if (error) throw error;
      await refetch();
      toast({ title: "Perfil atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: translateError(err.message), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: fontHeading }}>Perfil</h2>

      {/* Avatar + Info */}
      <motion.div
        custom={0}
        variants={sectionVariant}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-4 mb-7"
      >
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${primary}bb)`,
            color: "#fff",
            boxShadow: `0 4px 16px -4px ${primary}50`,
          }}
        >
          {name ? name.charAt(0).toUpperCase() : <User className="h-7 w-7" />}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ fontFamily: fontHeading }}>{name || "Cliente"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </motion.div>

      {/* Edit Form Card */}
      <motion.div
        custom={1}
        variants={sectionVariant}
        initial="hidden"
        animate="visible"
        className="rounded-[20px] p-5 space-y-4 mb-5 bg-card"
        style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}
      >
        <div>
          <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-11 border-0 bg-muted" />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" className="rounded-xl h-11 border-0 bg-muted" />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Email</Label>
          <Input value={user?.email || ""} disabled className="rounded-xl h-11 border-0 opacity-60 bg-muted" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-2xl font-bold text-sm" style={{ backgroundColor: primary, color: "#fff" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar alterações
        </Button>
      </motion.div>

      {/* Branch Selector */}
      {branches.length > 1 && (
        <motion.div
          custom={2}
          variants={sectionVariant}
          initial="hidden"
          animate="visible"
          className="rounded-[20px] p-5 mb-5 bg-card"
          style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" style={{ color: primary }} />
            <span className="text-sm font-bold text-muted-foreground">Filial</span>
          </div>
          <div className="space-y-2">
            {branches.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id;
              return (
                <motion.button
                  key={branch.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedBranch(branch)}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all flex items-center justify-between ${isSelected ? "" : "bg-muted"}`}
                  style={{
                    backgroundColor: isSelected ? `${primary}10` : undefined,
                    border: isSelected ? `1.5px solid ${primary}40` : "1.5px solid transparent",
                  }}
                >
                  <div>
                    <span className="font-semibold" style={{ color: isSelected ? primary : fg }}>{branch.name}</span>
                    {branch.city && <span className="ml-1.5 text-xs" style={{ color: `${fg}40` }}>· {branch.city}</span>}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primary }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Favorites Section */}
      <FavoritesSection customer={customer} primary={primary} fg={fg} fontHeading={fontHeading} />

      {/* Menu items */}
      <motion.div
        custom={3}
        variants={sectionVariant}
        initial="hidden"
        animate="visible"
        className="rounded-[20px] overflow-hidden bg-card mb-5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        {/* Dark mode toggle */}
        <DarkModeToggle primary={primary} fg={fg} />
        <div style={{ borderBottom: `1px solid ${fg}08` }} />
        {[
          { icon: Shield, label: "Privacidade e Segurança" },
          { icon: HelpCircle, label: "Ajuda e Suporte" },
        ].map(({ icon: Icon, label }, idx) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors ${idx === 0 ? "border-b border-border/50" : ""}`}
          >
            <Icon className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </motion.button>
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div custom={4} variants={sectionVariant} initial="hidden" animate="visible">
        <Button
          variant="outline"
          onClick={() => signOut()}
          className="w-full h-11 rounded-2xl font-semibold text-sm border-0"
          style={{ backgroundColor: "hsl(0 72% 56% / 0.08)", color: "hsl(0 72% 51%)" }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>
      </motion.div>
    </div>
  );
}

// --- Dark Mode Toggle ---
function DarkModeToggle({ primary, fg }: { primary: string; fg: string }) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("customer_dark_mode", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("customer_dark_mode");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={toggle}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-muted-foreground" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-muted-foreground" />
      )}
      <span className="flex-1">{isDark ? "Modo claro" : "Modo escuro"}</span>
      <div
        className="relative h-7 w-12 rounded-full transition-colors duration-300"
        style={{ backgroundColor: isDark ? primary : "hsl(var(--muted-foreground) / 0.2)" }}
      >
        <motion.div
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
          animate={{ left: isDark ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
}

// --- Favorites Section ---
function FavoritesSection({ customer, primary, fg, fontHeading }: { customer: any; primary: string; fg: string; fontHeading: string }) {
  const { openOffer, isFavorite, toggleFavorite } = useCustomerNav();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_favorites")
        .select("offer_id, offers(id, title, image_url, value_rescue, description, stores(name, logo_url))")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      setFavorites((data || []).map((d: any) => d.offers).filter(Boolean));
      setLoading(false);
    };
    fetch();
  }, [customer]);

  if (loading) {
    return (
      <motion.div custom={2.5} variants={sectionVariant} initial="hidden" animate="visible" className="rounded-[20px] p-5 mb-5 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4" style={{ color: primary }} />
        <span className="text-sm font-bold text-muted-foreground">Meus Favoritos</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div custom={2.5} variants={sectionVariant} initial="hidden" animate="visible" className="rounded-[20px] p-5 mb-5 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4" style={{ color: primary }} />
        <span className="text-sm font-bold text-muted-foreground">Meus Favoritos</span>
        {favorites.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary}12`, color: primary }}>
            {favorites.length}
          </span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-6 opacity-40">
          <Heart className="h-8 w-8 mx-auto mb-2" style={{ color: `${fg}30` }} />
          <p className="text-xs">Nenhuma oferta salva ainda</p>
          <p className="text-[10px] mt-0.5">Toque no ♥ nas ofertas para salvar aqui</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {favorites.map((offer: any) => (
            <motion.button
              key={offer.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => openOffer(offer)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              <div className="h-11 w-11 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: `${primary}08` }}>
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Tag className="h-5 w-5" style={{ color: `${primary}40` }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>{offer.title}</p>
                {offer.stores?.name && (
                  <p className="text-[10px] truncate text-muted-foreground">{offer.stores.name}</p>
                )}
              </div>
              {Number(offer.value_rescue) > 0 && (
                <span className="text-xs font-bold shrink-0" style={{ color: primary }}>
                  R$ {Number(offer.value_rescue).toFixed(2)}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(offer.id); }}
                className="shrink-0 p-1"
              >
                <Heart className="h-4 w-4" fill={primary} style={{ color: primary }} />
              </button>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
