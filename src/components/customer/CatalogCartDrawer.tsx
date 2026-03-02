import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, Sparkles } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  qty: number;
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
  brandId: string;
  branchId: string;
  storeId: string;
  customerId?: string;
  primary: string;
  fontHeading: string;
  onOrderSent?: () => void;
}

export default function CatalogCartDrawer({
  open, onOpenChange, items, onUpdateQty, onRemove,
  pointsPerReal, whatsapp, storeName, customerName,
  brandId, branchId, storeId, customerId,
  primary, fontHeading, onOrderSent,
}: Props) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const pointsEstimate = Math.floor(total * pointsPerReal);

  const handleSendWhatsApp = async () => {
    if (!whatsapp) return;

    const lines = [
      `📋 *Pedido - ${storeName}*`,
      customerName ? `👤 Cliente: ${customerName}` : "",
      "",
      ...items.map(i => `• ${i.name} ×${i.qty} = R$ ${(i.price * i.qty).toFixed(2)}`),
      "",
      `💰 *Total: R$ ${total.toFixed(2)}*`,
      pointsPerReal > 0 ? `🎯 *Pontos estimados: ${pointsEstimate} pts*` : "",
    ].filter(Boolean).join("\n");

    const encoded = encodeURIComponent(lines);
    const cleanPhone = whatsapp.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Save order record
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("catalog_cart_orders" as any).insert({
        store_id: storeId,
        brand_id: brandId,
        branch_id: branchId,
        customer_id: customerId || null,
        items_json: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total_amount: total,
        points_earned_estimate: pointsEstimate,
        whatsapp_url_sent: url,
      });
    } catch {}

    window.open(url, "_blank");
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

        <div className="px-4 overflow-y-auto max-h-[40vh] space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
              {item.image_url && (
                <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {item.price.toFixed(2)} × {item.qty} = <span className="font-bold text-foreground">R$ {(item.price * item.qty).toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => item.qty <= 1 ? onRemove(item.id) : onUpdateQty(item.id, item.qty - 1)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center bg-background border"
                >
                  {item.qty <= 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.qty + 1)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: primary }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Points highlight */}
        {pointsPerReal > 0 && (
          <div
            className="mx-4 mt-4 p-4 rounded-2xl text-center"
            style={{ backgroundColor: `${primary}12` }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-5 w-5" style={{ color: primary }} />
              <span className="text-lg font-black" style={{ color: primary, fontFamily: fontHeading }}>
                {pointsEstimate} pontos
              </span>
            </div>
            <p className="text-xs" style={{ color: `${primary}90` }}>
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
            disabled={!whatsapp}
            className="w-full h-14 rounded-2xl text-base font-bold gap-2"
            style={{ backgroundColor: "#25D366", color: "white" }}
          >
            <MessageCircle className="h-5 w-5" />
            Enviar pedido pelo WhatsApp
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
