import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Store, Package } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
  catalogItems: { id: string; name: string; price: number }[];
}

export default function StepCouponType({ data, update, catalogItems }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Tipo do Cupom</Label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => update({ coupon_type: "STORE", product_id: "" })}
          className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${
            data.coupon_type === "STORE"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Store className="h-8 w-8" />
          <span className="font-semibold">Loja Toda</span>
          <span className="text-xs text-muted-foreground text-center">Cupom válido para qualquer produto/serviço</span>
        </button>
        <button
          type="button"
          onClick={() => update({ coupon_type: "PRODUCT" })}
          className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${
            data.coupon_type === "PRODUCT"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Package className="h-8 w-8" />
          <span className="font-semibold">Produto Específico</span>
          <span className="text-xs text-muted-foreground text-center">Cupom válido para um item do catálogo</span>
        </button>
      </div>

      {data.coupon_type === "PRODUCT" && (
        <div className="space-y-2 pt-2">
          <Label>Selecione o produto</Label>
          {catalogItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item no catálogo. Adicione produtos primeiro.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {catalogItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ product_id: item.id })}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                    data.product_id === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground ml-2">R$ {item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
