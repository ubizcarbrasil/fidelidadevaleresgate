// Voucher Redeem Page
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VoucherData {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_percent: number;
  status: string;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  campaign: string | null;
  customer_name: string | null;
  branches: { name: string; brands: { name: string } } | null;
}

export default function VoucherRedeem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [searching, setSearching] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setVoucher(null);
    setRedeemed(false);

    const { data, error } = await supabase
      .from("vouchers")
      .select("id, code, title, description, discount_percent, status, max_uses, current_uses, expires_at, campaign, customer_name, branches(name, brands(name))")
      .eq("code", code.toUpperCase().trim())
      .maybeSingle();

    if (error) {
      toast.error(error.message);
    } else if (!data) {
      toast.error("Voucher não encontrado");
    } else {
      setVoucher(data as any);
    }
    setSearching(false);
  };

  const canRedeem = voucher && voucher.status === "active" && voucher.current_uses < voucher.max_uses &&
    (!voucher.expires_at || new Date(voucher.expires_at) > new Date());

  const handleRedeem = async () => {
    if (!voucher || !user) return;
    setRedeeming(true);

    // Insert redemption
    const { error: redeemError } = await supabase
      .from("voucher_redemptions")
      .insert({ voucher_id: voucher.id, redeemed_by: user.id, notes: notes || null });

    if (redeemError) {
      toast.error(redeemError.message);
      setRedeeming(false);
      return;
    }

    // Update voucher uses count
    const newUses = voucher.current_uses + 1;
    const newStatus = newUses >= voucher.max_uses ? "depleted" : "active";
    await supabase
      .from("vouchers")
      .update({ current_uses: newUses, status: newStatus })
      .eq("id", voucher.id);

    setRedeemed(true);
    setVoucher({ ...voucher, current_uses: newUses, status: newStatus });
    toast.success("Voucher resgatado com sucesso!");
    setRedeeming(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Button variant="ghost" onClick={() => navigate("/vouchers")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Resgatar Voucher</CardTitle>
          <CardDescription>Digite o código do voucher para validar e resgatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="CÓDIGO DO VOUCHER"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="font-mono text-lg tracking-wider"
            />
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {voucher && (
            <Card className={redeemed ? "border-primary bg-primary/5" : ""}>
              <CardContent className="pt-4 space-y-3">
                {redeemed && (
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    Voucher resgatado com sucesso!
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{voucher.title}</h3>
                  <Badge variant={voucher.status === "active" ? "default" : "destructive"}>
                    {voucher.status === "active" ? "Ativo" : voucher.status === "depleted" ? "Esgotado" : voucher.status}
                  </Badge>
                </div>

                <div className="text-3xl font-bold text-primary">{voucher.discount_percent}% OFF</div>

                {voucher.description && <p className="text-sm text-muted-foreground">{voucher.description}</p>}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Branch:</span> {(voucher.branches as any)?.name}</div>
                  <div><span className="text-muted-foreground">Brand:</span> {(voucher.branches as any)?.brands?.name}</div>
                  <div><span className="text-muted-foreground">Usos:</span> {voucher.current_uses}/{voucher.max_uses}</div>
                  <div><span className="text-muted-foreground">Validade:</span> {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}</div>
                  {voucher.campaign && <div className="col-span-2"><span className="text-muted-foreground">Campanha:</span> {voucher.campaign}</div>}
                  {voucher.customer_name && <div className="col-span-2"><span className="text-muted-foreground">Cliente:</span> {voucher.customer_name}</div>}
                </div>

                {canRedeem && !redeemed && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label>Observações do resgate</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionais..." />
                    <Button onClick={handleRedeem} disabled={redeeming} className="w-full">
                      {redeeming ? "Resgatando..." : "Confirmar Resgate"}
                    </Button>
                  </div>
                )}

                {!canRedeem && !redeemed && (
                  <div className="text-sm text-destructive font-medium pt-2 border-t">
                    {voucher.status !== "active" ? "Este voucher não está ativo." :
                     voucher.current_uses >= voucher.max_uses ? "Este voucher já atingiu o limite de usos." :
                     "Este voucher está expirado."}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
