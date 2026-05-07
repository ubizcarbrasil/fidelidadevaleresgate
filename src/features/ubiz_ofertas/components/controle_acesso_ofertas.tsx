import { Lock, Globe, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type ModoAcessoOfertas = "public" | "authenticated" | "whitelist";

interface Props {
  modo: ModoAcessoOfertas;
  whitelist: string[];
  onModoChange: (modo: ModoAcessoOfertas) => void;
  onWhitelistChange: (lista: string[]) => void;
}

const OPCOES: { value: ModoAcessoOfertas; label: string; descricao: string; icone: typeof Globe }[] = [
  {
    value: "public",
    label: "Totalmente público",
    descricao: "Qualquer pessoa com o link acessa a vitrine sem login.",
    icone: Globe,
  },
  {
    value: "authenticated",
    label: "Apenas usuários logados",
    descricao: "Exige login na plataforma para visualizar as ofertas.",
    icone: Lock,
  },
  {
    value: "whitelist",
    label: "Lista de e-mails / telefones",
    descricao: "Somente contatos da lista abaixo podem visualizar.",
    icone: ShieldCheck,
  },
];

function normalizar(valor: string): string {
  const trim = valor.trim().toLowerCase();
  if (!trim) return "";
  // Telefone: mantém apenas dígitos
  if (/^[\d+()\-\s]+$/.test(trim) && !trim.includes("@")) {
    return trim.replace(/\D/g, "");
  }
  return trim;
}

export default function ControleAcessoOfertas({ modo, whitelist, onModoChange, onWhitelistChange }: Props) {
  const adicionarItem = (raw: string) => {
    const itens = raw
      .split(/[\n,;]/)
      .map(normalizar)
      .filter((v) => v.length > 0);
    if (itens.length === 0) return;
    const conjunto = new Set([...(whitelist || []), ...itens]);
    onWhitelistChange(Array.from(conjunto));
  };

  const removerItem = (item: string) => {
    onWhitelistChange((whitelist || []).filter((v) => v !== item));
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <Label className="text-xs font-semibold">Controle de acesso da vitrine</Label>
      </div>

      <div className="grid gap-2">
        {OPCOES.map((opt) => {
          const Icone = opt.icone;
          const ativo = modo === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onModoChange(opt.value)}
              className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                ativo
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <Icone className={`h-4 w-4 mt-0.5 shrink-0 ${ativo ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1 space-y-0.5">
                <p className={`text-xs font-medium ${ativo ? "text-foreground" : "text-foreground/80"}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{opt.descricao}</p>
              </div>
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 mt-0.5 ${
                  ativo ? "border-primary bg-primary" : "border-muted-foreground/40"
                }`}
              />
            </button>
          );
        })}
      </div>

      {modo === "whitelist" && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-[11px] text-muted-foreground">
            Adicione e-mails ou telefones (separe por vírgula, ponto e vírgula ou nova linha)
          </Label>
          <FormularioAdicao onAdicionar={adicionarItem} />

          {whitelist && whitelist.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {whitelist.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[11px]"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removerItem(item)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remover ${item}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              Nenhum contato na lista. A vitrine ficará inacessível até você adicionar pelo menos um.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FormularioAdicao({ onAdicionar }: { onAdicionar: (raw: string) => void }) {
  return (
    <div className="flex gap-2">
      <Textarea
        placeholder="exemplo@email.com, 11999998888"
        rows={2}
        className="text-xs"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const target = e.currentTarget;
            onAdicionar(target.value);
            target.value = "";
          }
        }}
        id="ofertas-whitelist-input"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0 self-end"
        onClick={() => {
          const el = document.getElementById("ofertas-whitelist-input") as HTMLTextAreaElement | null;
          if (!el) return;
          onAdicionar(el.value);
          el.value = "";
        }}
        title="Adicionar"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}