import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Save, Loader2, User, ChevronRight, MapPin, Shield, HelpCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

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
      const { error } = await supabase
        .from("customers")
        .update({ name, phone })
        .eq("id", customer.id);
      if (error) throw error;
      await refetch();
      toast({ title: "Perfil atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: fontHeading }}>Perfil</h2>

      {/* Avatar + Info */}
      <div className="flex items-center gap-4 mb-7">
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
          <p className="text-sm" style={{ color: `${fg}50` }}>{user?.email}</p>
        </div>
      </div>

      {/* Edit Form Card */}
      <div
        className="rounded-[20px] p-5 space-y-4 mb-5 bg-white"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <div>
          <Label className="text-xs font-semibold mb-1.5 block" style={{ color: `${fg}55` }}>Nome</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl h-11 border-0"
            style={{ backgroundColor: "#F2F2F7" }}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block" style={{ color: `${fg}55` }}>Telefone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-0000"
            className="rounded-xl h-11 border-0"
            style={{ backgroundColor: "#F2F2F7" }}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block" style={{ color: `${fg}55` }}>Email</Label>
          <Input
            value={user?.email || ""}
            disabled
            className="rounded-xl h-11 border-0 opacity-60"
            style={{ backgroundColor: "#F2F2F7" }}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 rounded-2xl font-bold text-sm"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar alterações
        </Button>
      </div>

      {/* Branch Selector */}
      {branches.length > 1 && (
        <div
          className="rounded-[20px] p-5 mb-5 bg-white"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" style={{ color: primary }} />
            <span className="text-sm font-bold" style={{ color: `${fg}70` }}>Filial</span>
          </div>
          <div className="space-y-2">
            {branches.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch)}
                  className="w-full text-left rounded-xl px-4 py-3 text-sm transition-all flex items-center justify-between"
                  style={{
                    backgroundColor: isSelected ? `${primary}10` : "#F2F2F7",
                    border: isSelected ? `1.5px solid ${primary}40` : "1.5px solid transparent",
                  }}
                >
                  <div>
                    <span className="font-semibold" style={{ color: isSelected ? primary : fg }}>
                      {branch.name}
                    </span>
                    {branch.city && (
                      <span className="ml-1.5 text-xs" style={{ color: `${fg}40` }}>· {branch.city}</span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primary }}>
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

      {/* Menu items */}
      <div
        className="rounded-[20px] overflow-hidden bg-white mb-5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        {[
          { icon: Shield, label: "Privacidade e Segurança" },
          { icon: HelpCircle, label: "Ajuda e Suporte" },
        ].map(({ icon: Icon, label }, idx) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-left hover:bg-black/[0.02] transition-colors"
            style={{
              borderBottom: idx === 0 ? `1px solid ${fg}08` : "none",
            }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: `${fg}45` }} />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4" style={{ color: `${fg}25` }} />
          </button>
        ))}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={() => signOut()}
        className="w-full h-11 rounded-2xl font-semibold text-sm border-0"
        style={{ backgroundColor: "hsl(0 72% 56% / 0.08)", color: "hsl(0 72% 51%)" }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
}
