import { useState, useMemo } from "react";
import { Search, BookOpen, Palette, Sparkles, ShoppingBag, Store, Coins, ReceiptText, ShieldCheck, Users, BarChart3, Key, Settings2, Swords } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ManualRenderer } from "@/components/manuais/ManualRenderer";
import { gruposManuais, gruposManuaisFranqueado } from "@/components/manuais/dados_manuais";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBranchScoringModel } from "@/hooks/useBranchScoringModel";

const iconesPorNome: Record<string, any> = {
  Palette, Sparkles, ShoppingBag, Store, Coins, ReceiptText, ShieldCheck, Users, BarChart3, Key, Settings2, Swords,
};

export default function ManuaisPage() {
  const { consoleScope } = useBrandGuard();
  const { isDriverEnabled, isPassengerEnabled } = useBranchScoringModel();
  const [busca, setBusca] = useState("");
  const [manualAberto, setManualAberto] = useState<string | null>(null);

  const todosGrupos = useMemo(() => {
    if (consoleScope === "BRANCH") {
      // Franqueado vê somente manuais do franqueado, filtrados pelo scoring model
      return gruposManuaisFranqueado.filter((g) => {
        if (g.scoringFilter === "DRIVER" && !isDriverEnabled) return false;
        if (g.scoringFilter === "PASSENGER" && !isPassengerEnabled) return false;
        return true;
      });
    }
    // Empreendedor (BRAND) vê todos
    if (consoleScope === "BRAND") {
      return [...gruposManuais, ...gruposManuaisFranqueado];
    }
    return gruposManuais;
  }, [consoleScope, isDriverEnabled, isPassengerEnabled]);

  const gruposFiltrados = useMemo(() => {
    if (!busca.trim()) return todosGrupos;
    const termo = busca.toLowerCase();
    return todosGrupos
      .map((g) => ({
        ...g,
        manuais: g.manuais.filter(
          (m) =>
            m.titulo.toLowerCase().includes(termo) ||
            m.descricao.toLowerCase().includes(termo)
        ),
      }))
      .filter((g) => g.manuais.length > 0);
  }, [busca, todosGrupos]);

  const totalManuais = todosGrupos.reduce((acc, g) => acc + g.manuais.length, 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manuais da Plataforma</h1>
            <p className="text-xs text-muted-foreground">
              {totalManuais} guias instrutivos para todas as funcionalidades
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar manual por nome ou descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grupos */}
      {gruposFiltrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum manual encontrado para "{busca}"
        </div>
      ) : (
        <div className="space-y-6">
          {gruposFiltrados.map((grupo) => {
            const Icone = iconesPorNome[grupo.icone] || BookOpen;
            return (
              <section key={grupo.categoria} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icone className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">{grupo.categoria}</h2>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {grupo.manuais.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {grupo.manuais.map((manual) => (
                    <ManualRenderer
                      key={manual.id}
                      manual={manual}
                      aberto={manualAberto === manual.id}
                      onToggle={() =>
                        setManualAberto((prev) => (prev === manual.id ? null : manual.id))
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
