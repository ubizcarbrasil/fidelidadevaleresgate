/**
 * AbaManual — Sub-fase 5.10
 * Renderiza o grupo "Central de Módulos (Root)" do catálogo de manuais
 * dentro da própria Central de Módulos, evitando que o usuário precise
 * sair da página para consultar a documentação.
 */
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ManualRenderer } from "@/components/manuais/ManualRenderer";
import { gruposManuais } from "@/components/manuais/dados_manuais";

const CATEGORIA_ALVO = "Central de Módulos (Root)";

export default function AbaManual() {
  const [busca, setBusca] = useState("");
  const [manualAberto, setManualAberto] = useState<string | null>(null);

  const grupo = useMemo(
    () => gruposManuais.find((g) => g.categoria === CATEGORIA_ALVO),
    []
  );

  const manuaisFiltrados = useMemo(() => {
    if (!grupo) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupo.manuais;
    return grupo.manuais.filter(
      (m) =>
        m.titulo.toLowerCase().includes(termo) ||
        m.descricao.toLowerCase().includes(termo)
    );
  }, [grupo, busca]);

  if (!grupo) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Manual indisponível no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold leading-tight">
            Manual da Central de Módulos
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Guia completo de cada aba: do Catálogo técnico aos Modelos de
            Negócio, Planos, Empreendedores, Cidades e Auditoria.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no manual..."
          className="pl-9"
        />
      </div>

      {manuaisFiltrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum manual encontrado para "{busca}".
        </div>
      ) : (
        <div className="space-y-2">
          {manuaisFiltrados.map((manual) => (
            <ManualRenderer
              key={manual.id}
              manual={manual}
              aberto={manualAberto === manual.id}
              onToggle={() =>
                setManualAberto((atual) => (atual === manual.id ? null : manual.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
