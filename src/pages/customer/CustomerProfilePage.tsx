import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Save, Loader2, User } from "lucide-react";
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
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
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

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: fontHeading }}>Perfil</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          {name ? name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
        </div>
        <div>
          <p className="font-semibold">{name || "Cliente"}</p>
          <p className="text-sm opacity-50">{user?.email}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div
        className="rounded-xl border p-4 space-y-4 mb-6"
        style={{ backgroundColor: cardBg, borderColor: `${fg}12` }}
      >
        <div>
          <Label className="text-sm mb-1 block opacity-70">Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm mb-1 block opacity-70">Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
        </div>
        <div>
          <Label className="text-sm mb-1 block opacity-70">Email</Label>
          <Input value={user?.email || ""} disabled className="opacity-60" />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg font-semibold"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {/* Branch Selector */}
      {branches.length > 1 && (
        <div
          className="rounded-xl border p-4 mb-6"
          style={{ backgroundColor: cardBg, borderColor: `${fg}12` }}
        >
          <Label className="text-sm mb-2 block opacity-70">Filial</Label>
          <div className="space-y-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className="w-full text-left rounded-lg px-3 py-2 text-sm transition-colors border"
                style={{
                  backgroundColor: selectedBranch?.id === branch.id ? `${primary}15` : "transparent",
                  borderColor: selectedBranch?.id === branch.id ? primary : `${fg}10`,
                  color: selectedBranch?.id === branch.id ? primary : fg,
                }}
              >
                {branch.name}
                {branch.city && <span className="opacity-50 ml-1">· {branch.city}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full rounded-lg"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}
