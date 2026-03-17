import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, Sparkles, User } from "lucide-react";
import { brandAlpha } from "@/lib/utils";
import { openLink } from "@/lib/openLink";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  qty: number;
  is_half?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  pointsPerReal: number;
  whatsapp: string | null;
  storeName: string;
  customerName?: string;
  customerCpf?: string;
  brandId: string;
  branchId: string;
  storeId: string;
  customerId?: string;
  primary: string;
  fontHeading: string;
  onOrderSent?: () => void;
}

function formatCpf(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(v: string) {
  return v.replace(/\D/g, "").length === 11;
}

export default function CatalogCartDrawer({
  open, onOpenChange, items, onUpdateQty, onRemove,
  pointsPerReal, whatsapp, storeName, customerName,
  customerCpf: initialCpf,
  brandId, branchId, storeId, customerId,
  primary, fontHeading, onOrderSent,
}: Props) {
  const [cpf, setCpf] = useState(initialCpf || "");
  const [sending, setSending] = useState(false);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const pointsEstimate = Math.floor(total * pointsPerReal);

  const handleSendWhatsApp = async () => {
    if (!whatsapp) return;
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!isValidCpf(cpf)) return;

    setSending(true);

    const lines = [
      `📋 *Pedido - ${storeName}*`,
      customerName ? `👤 Cliente: ${customerName}` : "",
      `🪪 CPF: ${formatCpf(cleanCpf)}`,
      "",
      ...items.map(i => {
        const halfLabel = i.is_half ? " (MEIA)" : "";
        return `• ${i.name}${halfLabel} ×${i.qty} = R$ ${(i.price * i.qty).toFixed(2)}`;
      }),
      "",
      `💰 *Total: R$ ${total.toFixed(2)}*`,
      pointsPerReal > 0 ? `🎯 *Pontos estimados: ${pointsEstimate} pts*` : "",
    ].filter(Boolean).join("\n");

    const encoded = encodeURIComponent(lines);
    const cleanPhone = whatsapp.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Save order record + update customer CPF
    try {
      const { supabase } = await import("@/integrations/supabase/client");

      // Save CPF on customer if not set
      if (customerId && cleanCpf) {
        await supabase.from("customers").update({ cpf: cleanCpf }).eq("id", customerId);
      }

      await supabase.from("catalog_cart_orders").insert({
        store_id: storeId,
        brand_id: brandId,
        branch_id: branchId,
        customer_id: customerId || null,
        items_json: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, is_half: i.is_half || false })),
        total_amount: total,
        points_earned_estimate: pointsEstimate,
        whatsapp_url_sent: url,
        status: "PENDING",
        customer_name: customerName || null,
        customer_cpf: cleanCpf || null,
      });
    } catch {}

    setSending(false);
    await openLink({
      url,
      mode: "REDIRECT",
      tracking: {
        brand_id: brandId,
        branch_id: branchId,
        customer_id: customerId,
        click_type: "catalog_whatsapp_checkout",
        source_context_json: {
          store_id: storeId,
          store_name: storeName,
          total_amount: total,
          total_items: totalQty,
          points_estimate: pointsEstimate,
        },
      },
    });
    onOrderSent?.();
    onOpenChange(false);
  };

  if (items.length === 0) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2" style={{ fontFamily: fontHeading }}>
            <ShoppingBag className="h-5 w-5" style={{ color: primary }} />
            Seu Pedido ({totalQty} {totalQty === 1 ? "item" : "itens"})
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto max-h-[35vh] space-y-3">
          {items.map(item => (
            <div key={`${item.id}-${item.is_half}`} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
              {item.image_url && (
                <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {item.name}
                  {item.is_half && <span className="text-xs font-normal text-muted-foreground ml-1">(Meia)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  R$ {item.price.toFixed(2)} × {item.qty} = <span className="font-bold text-foreground">R$ {(item.price * item.qty).toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => item.qty <= 1 ? onRemove(`${item.id}-${item.is_half}`) : onUpdateQty(`${item.id}-${item.is_half}`, item.qty - 1)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center bg-background border"
                >
                  {item.qty <= 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                <button
                  onClick={() => onUpdateQty(`${item.id}-${item.is_half}`, item.qty + 1)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: primary }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CPF field */}
        <div className="px-4 mt-3">
          <div className="flex items-center gap-2 mb-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs font-semibold">CPF para pontuação</Label>
          </div>
          <Input
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))}
            className="rounded-xl h-10 border-0 bg-muted/50"
            inputMode="numeric"
          />
          {cpf && !isValidCpf(cpf) && (
            <p className="text-[10px] text-destructive mt-1">CPF deve ter 11 dígitos</p>
          )}
        </div>

        {/* Points highlight */}
        {pointsPerReal > 0 && (
          <div
            className="mx-4 mt-3 p-4 rounded-2xl text-center"
            style={{ backgroundColor: brandAlpha(primary, 0.07) }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-5 w-5" style={{ color: primary }} />
              <span className="text-lg font-black" style={{ color: primary, fontFamily: fontHeading }}>
                {pointsEstimate} pontos
              </span>
            </div>
            <p className="text-xs" style={{ color: brandAlpha(primary, 0.56) }}>
              Você vai ganhar com este pedido!
            </p>
          </div>
        )}

        <DrawerFooter className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-black" style={{ fontFamily: fontHeading }}>
              R$ {total.toFixed(2)}
            </span>
          </div>
          <Button
            onClick={handleSendWhatsApp}
            disabled={!whatsapp || !isValidCpf(cpf) || sending}
            className="w-full h-14 rounded-2xl text-base font-bold gap-2"
            style={{ backgroundColor: "#25D366", color: "white" }}
          >
            <MessageCircle className="h-5 w-5" />
            {sending ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
          </Button>
          {!whatsapp && (
            <p className="text-xs text-center text-destructive mt-1">
              Esta loja não configurou o WhatsApp
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
