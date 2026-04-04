import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ChevronRight, Moon, Sun, Heart, Tag, X, icons } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { toast } from "@/hooks/use-toast";
import { translateError } from "@/lib/translateError";
import { Skeleton } from "@/components/ui/skeleton";
import { openLink } from "@/lib/openLink";
import type { ProfileMenuItem } from "@/pages/ProfileLinksConfigPage";
import { hslToCss, withAlpha, brandAlpha } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { formatPoints } from "@/lib/formatPoints";

export default function CustomerProfilePage() {
  const { user, signOut } = useAuth();
  const { customer, refetch } = useCustomer();
  const { brand, theme, branches, selectedBranch, setSelectedBranch } = useBrand();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [textOverlay, setTextOverlay] = useState<{ title: string; content: string } | null>(null);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const settings = (brand?.brand_settings_json ?? {}) as { profile_menu_links?: ProfileMenuItem[] };
  const profileMenuLinks: ProfileMenuItem[] = settings.profile_menu_links || [
    { id: "privacy", label: "Privacidade e Segurança", type: "link", url: "", text_content: "", icon_name: "Shield", is_visible: true },
    { id: "help", label: "Ajuda e Suporte", type: "link", url: "", text_content: "", icon_name: "CircleHelp", is_visible: true },
  ];
  const visibleLinks = profileMenuLinks.filter((l) => l.is_visible);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro", description: translateError(message), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: fontHeading }}>Perfil</h2>

      {/* Avatar + Info */}
      <div className="flex items-center gap-4 mb-7 animate-fade-in">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${brandAlpha(primary, 0.73)})`,
            color: "#fff",
            boxShadow: `0 4px 16px -4px ${brandAlpha(primary, 0.31)}`,
          }}
        >
          {name ? name.charAt(0).toUpperCase() : <AppIcon iconKey="profile_user" className="h-7 w-7" />}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ fontFamily: fontHeading }}>{name || "Cliente"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Edit Form Card */}
      <div
        className="rounded-[20px] p-5 space-y-4 mb-5 bg-card animate-fade-in"
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
        <LoadingButton onClick={handleSave} isLoading={saving} loadingText="Salvando..." className="w-full h-11 rounded-2xl font-bold text-sm" style={{ backgroundColor: primary, color: "#fff" }}>
          <Save className="h-4 w-4 mr-2" />
          Salvar alterações
        </LoadingButton>
      </div>

      {/* Branch Selector */}
      {branches.length > 1 && (
        <div
          className="rounded-[20px] p-5 mb-5 bg-card animate-fade-in"
          style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AppIcon iconKey="profile_branch" className="h-4 w-4" style={{ color: primary }} />
            <span className="text-sm font-bold text-muted-foreground">Filial</span>
          </div>
          <div className="space-y-2">
            {branches.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch)}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all flex items-center justify-between active:scale-[0.97] ${isSelected ? "" : "bg-muted"}`}
                  style={{
                    backgroundColor: isSelected ? brandAlpha(primary, 0.06) : undefined,
                    border: isSelected ? `1.5px solid ${brandAlpha(primary, 0.25)}` : "1.5px solid transparent",
                  }}
                >
                  <div>
                    <span className="font-semibold" style={{ color: isSelected ? primary : fg }}>{branch.name}</span>
                    {branch.city && <span className="ml-1.5 text-xs" style={{ color: brandAlpha(fg, 0.25) }}>· {branch.city}</span>}
                  </div>
                  {isSelected && (
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center animate-scale-in"
                      style={{ backgroundColor: primary }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Favorites Section */}
      <FavoritesSection customer={customer} primary={primary} fg={fg} fontHeading={fontHeading} />

      {/* Menu items */}
      <div
        className="rounded-[20px] overflow-hidden bg-card mb-5 animate-fade-in"
        style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}
      >
        {/* Dark mode toggle */}
        <DarkModeToggle primary={primary} fg={fg} />
        {visibleLinks.map((link, idx) => (
          <ProfileMenuItemButton
            key={link.id}
            item={link}
            isLast={idx === visibleLinks.length - 1}
            fg={fg}
            onOpenText={(title, content) => setTextOverlay({ title, content })}
          />
        ))}
      </div>

      {/* Text Content Overlay */}
      {textOverlay && (
        <div className="fixed inset-0 z-[200] bg-background animate-fade-in">
          <div className="max-w-lg mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>{textOverlay.title}</h2>
              <button onClick={() => setTextOverlay(null)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {textOverlay.content}
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="animate-fade-in">
        <Button
          variant="outline"
          onClick={() => signOut()}
          className="w-full h-11 rounded-2xl font-semibold text-sm border-0"
          style={{ backgroundColor: "hsl(0 72% 56% / 0.08)", color: "hsl(0 72% 51%)" }}
        >
          <AppIcon iconKey="profile_logout" className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>
      </div>
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
    <button
      onClick={toggle}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors active:scale-[0.98]"
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
        <div
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-300"
          style={{ left: isDark ? 22 : 2 }}
        />
      </div>
    </button>
  );
}

// --- Favorites Section ---
interface FavoriteOffer {
  id: string;
  title: string;
  image_url: string | null;
  value_rescue: number;
  description: string | null;
  stores?: { name: string; logo_url: string | null } | null;
}

function FavoritesSection({ customer, primary, fg, fontHeading }: { customer: { id: string } | null; primary: string; fg: string; fontHeading: string }) {
  const { openOffer, isFavorite, toggleFavorite } = useCustomerNav();

  const { data: favorites = [], isLoading: loading } = useQuery({
    queryKey: ["customer-favorites", customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_favorites")
        .select("offer_id, offers(id, title, image_url, value_rescue, description, stores(name, logo_url))")
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false });
      return (data || []).map((d) => d.offers as unknown as FavoriteOffer).filter(Boolean);
    },
  });

  if (loading) {
    return (
      <div className="rounded-[20px] p-5 mb-5 bg-card animate-fade-in" style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}>
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
      </div>
    );
  }

  return (
    <div className="rounded-[20px] p-5 mb-5 bg-card animate-fade-in" style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4" style={{ color: primary }} />
        <span className="text-sm font-bold text-muted-foreground">Meus Favoritos</span>
        {favorites.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: brandAlpha(primary, 0.07), color: primary }}>
            {favorites.length}
          </span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-6 opacity-40">
          <Heart className="h-8 w-8 mx-auto mb-2" style={{ color: brandAlpha(fg, 0.19) }} />
          <p className="text-xs">Nenhuma oferta salva ainda</p>
          <p className="text-[10px] mt-0.5">Toque no ♥ nas ofertas para salvar aqui</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {favorites.map((offer) => (
            <button
              key={offer.id}
              onClick={() => openOffer(offer)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left active:scale-[0.97]"
            >
              <div className="h-11 w-11 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: brandAlpha(primary, 0.03) }}>
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Tag className="h-5 w-5" style={{ color: brandAlpha(primary, 0.25) }} />
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
                  {formatPoints(Number(offer.value_rescue))} pts
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(offer.id); }}
                className="shrink-0 p-1"
              >
                <Heart className="h-4 w-4" fill={primary} style={{ color: primary }} />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Profile Menu Item Button ---
function ProfileMenuItemButton({
  item,
  isLast,
  fg,
  onOpenText,
}: {
  item: ProfileMenuItem;
  isLast: boolean;
  fg: string;
  onOpenText: (title: string, content: string) => void;
}) {
  const LucideIcon = (icons as Record<string, React.ComponentType<{ className?: string }>>)[item.icon_name];

  const handleClick = () => {
    if (item.type === "text") {
      onOpenText(item.label, item.text_content);
    } else if (item.type === "link_text") {
      if (item.url) {
        openLink({ url: item.url, mode: "REDIRECT" });
      } else {
        onOpenText(item.label, item.text_content);
      }
    } else if (item.type === "link" && item.url) {
      openLink({ url: item.url, mode: "REDIRECT" });
    }
  };

  return (
    <>
      <div style={{ borderBottom: isLast ? "none" : `1px solid ${brandAlpha(fg, 0.03)}` }} />
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors active:scale-[0.98]"
      >
        {LucideIcon ? (
          <LucideIcon className="h-4.5 w-4.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4.5 w-4.5 text-muted-foreground" />
        )}
        <span className="flex-1">{item.label}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </button>
    </>
  );
}
