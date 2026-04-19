/**
 * GridModelosBrand — Sub-fase 5.5
 * Grid de modelos agrupado por audience (Cliente | Motorista | B2B).
 */
import CardModeloBrand from "./card_modelo_brand";
import type { ResolvedBusinessModel } from "@/compartilhados/hooks/hook_brand_plan_business_models";

interface Props {
  brandId: string;
  grouped: Record<"cliente" | "motorista" | "b2b", ResolvedBusinessModel[]>;
}

const GROUP_META: Record<
  "cliente" | "motorista" | "b2b",
  { emoji: string; label: string; description: string }
> = {
  cliente: {
    emoji: "🛍️",
    label: "Cliente",
    description: "Modelos voltados para clientes finais",
  },
  motorista: {
    emoji: "🚗",
    label: "Motorista",
    description: "Modelos voltados para motoristas parceiros",
  },
  b2b: {
    emoji: "🤝",
    label: "B2B",
    description: "Modelos de relacionamento entre marcas",
  },
};

const ORDER: Array<"cliente" | "motorista" | "b2b"> = [
  "cliente",
  "motorista",
  "b2b",
];

export default function GridModelosBrand({ brandId, grouped }: Props) {
  return (
    <div className="space-y-6">
      {ORDER.map((aud) => {
        const list = grouped[aud];
        if (!list || list.length === 0) return null;
        const meta = GROUP_META[aud];

        return (
          <section key={aud} className="space-y-3">
            <header className="flex items-center gap-2">
              <span className="text-lg">{meta.emoji}</span>
              <div>
                <h3 className="text-sm font-bold">
                  {meta.label.toUpperCase()} ({list.length})
                </h3>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((r) => (
                <CardModeloBrand key={r.def.id} brandId={brandId} resolved={r} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
