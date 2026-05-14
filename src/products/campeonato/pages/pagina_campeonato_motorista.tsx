import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  Newspaper,
  ListOrdered,
  Crosshair,
  Swords,
  CalendarDays,
  Settings,
  Construction,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useTemporadaAtivaDoMotorista } from "../hooks/hook_campeonato_motorista";
import { useFotoPerfilMotorista } from "../hooks/useFotoPerfilMotorista";
import { AvatarMotorista } from "../components/shared/AvatarMotorista";
import BadgeFaseTemporada from "../components/badge_fase_temporada";
import AbaTabelaDuelos from "../components/motorista/aba_tabela_duelos";
import AbaClassificacao from "../components/motorista/AbaClassificacao";
import AbaChaveamento from "../components/motorista/AbaChaveamento";
import AbaArtilharia from "../components/motorista/AbaArtilharia";
import type { FaseCampeonato } from "../types/tipos_campeonato";
import AbaProximosCampeonatos from "../components/motorista/AbaProximosCampeonatos";
import AbaNoticias from "../components/motorista/AbaNoticias";
import AbaConfiguracoes from "../components/motorista/AbaConfiguracoes";
import type { AbaId as AbaIdShared } from "../types/tipos_navegacao_motorista";

type AbaId = AbaIdShared;

interface ItemNavegacao {
  id: AbaId;
  label: string;
  icon: typeof Trophy;
}

const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { id: "duelos", label: "Tabela de Duelos", icon: Swords },
  { id: "noticias", label: "Notícias", icon: Newspaper },
  { id: "classificacao", label: "Classificação", icon: ListOrdered },
  { id: "artilharia", label: "Artilharia", icon: Crosshair },
  { id: "chaveamento", label: "Chaveamento", icon: Trophy },
  { id: "proximos", label: "Próximos Campeonatos", icon: CalendarDays },
];

const PLACEHOLDERS: Record<AbaId, { label: string; descricao: string }> = {
  duelos: { label: "Tabela de Duelos", descricao: "Em construção — disponível em breve" },
  noticias: { label: "Notícias do Campeonato", descricao: "Em construção — disponível em breve" },
  classificacao: { label: "Classificação", descricao: "Em construção — disponível em breve" },
  artilharia: { label: "Artilharia / Recordes", descricao: "Em construção — disponível em breve" },
  chaveamento: { label: "Chaveamento", descricao: "Em construção — disponível em breve" },
  proximos: { label: "Próximos Campeonatos", descricao: "Em construção — disponível em breve" },
  configuracoes: { label: "Configurações", descricao: "Em construção — disponível em breve" },
};

interface SerieResumo {
  id: string;
  tier_name: string;
  tier_order: number;
}

interface Props {
  brandId: string;
  fontHeading?: string;
}

export default function PaginaCampeonatoMotorista({ brandId, fontHeading }: Props) {
  const queryClient = useQueryClient();
  const { driver } = useDriverSession();
  const driverId = driver?.id ?? null;
  const branchId = driver?.branch_id ?? null;

  const { data: temporada, isLoading: loadingTemporada } =
    useTemporadaAtivaDoMotorista(brandId, driverId);
  const { photoUrl } = useFotoPerfilMotorista(driverId);

  const seasonId = temporada?.season_id ?? null;

  const { data: series = [], isLoading: loadingSeries } = useQuery({
    queryKey: ["campeonato-series", seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<SerieResumo[]> => {
      const { data, error } = await (supabase as any)
        .from("campeonato_season_tiers")
        .select("id, tier_name, tier_order")
        .eq("season_id", seasonId)
        .order("tier_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SerieResumo[];
    },
  });

  const [abaAtiva, setAbaAtiva] = useState<AbaId>("duelos");
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [bottomSheetAberto, setBottomSheetAberto] = useState(false);
  const [rodadaAtiva, setRodadaAtiva] = useState(1);
  const [totalRodadas, setTotalRodadas] = useState(0);
  const [rotulosRodadas, setRotulosRodadas] = useState<string[]>([]);
  const [serieVisualizando, setSerieVisualizando] = useState<string | null>(null);

  // Hidrata a série visualizada com a série do motorista assim que disponível
  useEffect(() => {
    if (!serieVisualizando && temporada?.tier_id) {
      setSerieVisualizando(temporada.tier_id);
    }
  }, [serieVisualizando, temporada?.tier_id]);

  const serieAtualNome = useMemo(() => {
    const id = serieVisualizando ?? temporada?.tier_id;
    return series.find((s) => s.id === id)?.tier_name ?? temporada?.tier_name ?? "—";
  }, [series, serieVisualizando, temporada?.tier_id, temporada?.tier_name]);

  const showSubHeader = abaAtiva === "duelos" || abaAtiva === "chaveamento";

  const faseDestaqueChaveamento = useMemo<
    "r16" | "qf" | "sf" | "final" | undefined
  >(() => {
    const map: Array<"r16" | "qf" | "sf" | "final"> = ["r16", "qf", "sf", "final"];
    return map[Math.min(Math.max(0, rodadaAtiva - 1), 3)];
  }, [rodadaAtiva]);

  function handleRefresh() {
    // Invalida apenas as queries usadas pelo shell (não o queryClient inteiro)
    queryClient.invalidateQueries({ queryKey: ["driver-active-season", brandId, driverId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-series", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["foto-perfil-motorista"] });
    queryClient.invalidateQueries({ queryKey: ["tabela-duelos-rodadas", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["tabela-duelos-confrontos", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-classificacao-tier", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-bracket-v2", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-artilharia", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-proximos", branchId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-noticias", seasonId] });
    queryClient.invalidateQueries({ queryKey: ["campeonato-minhas-inscricoes", driverId] });
  }

  function selecionarAba(aba: AbaId) {
    setAbaAtiva(aba);
    setDrawerAberto(false);
    if (aba !== "duelos" && aba !== "chaveamento") {
      setRodadaAtiva(1);
    }
  }

  // Reseta rodada ao trocar de série visualizada
  useEffect(() => {
    setRodadaAtiva(1);
  }, [serieVisualizando]);

  const rotuloRodadaAtual = useMemo(() => {
    if (rotulosRodadas.length === 0) return `Rodada ${rodadaAtiva}`;
    const idx = Math.min(Math.max(0, rodadaAtiva - 1), rotulosRodadas.length - 1);
    const raw = rotulosRodadas[idx];
    const map: Record<string, string> = {
      r16: "Oitavas",
      qf: "Quartas",
      sf: "Semifinal",
      final: "Final",
    };
    return map[raw] ?? `Rodada ${idx + 1}`;
  }, [rotulosRodadas, rodadaAtiva]);

  return (
    <div className="tema-campeonato min-h-screen bg-background text-foreground">
      <HeaderCampeonato
        nomeCampeonato={temporada?.season_name ?? "Campeonato"}
        fase={(temporada?.phase as FaseCampeonato) ?? null}
        serieNome={serieAtualNome}
        loading={loadingTemporada}
        fontHeading={fontHeading}
        onAbrirDrawer={() => setDrawerAberto(true)}
        onAbrirSeries={() => setBottomSheetAberto(true)}
        onRefresh={handleRefresh}
      />

      {showSubHeader && (
        <SubHeaderRodada
          rotulo={rotuloRodadaAtual}
          onAnterior={() => setRodadaAtiva((n) => Math.max(1, n - 1))}
          onProxima={() =>
            setRodadaAtiva((n) =>
              totalRodadas > 0 ? Math.min(totalRodadas, n + 1) : n + 1,
            )
          }
        />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {serieVisualizando &&
          temporada?.tier_id &&
          serieVisualizando !== temporada.tier_id && (
            <div className="mb-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Você está vendo a {serieAtualNome}
            </div>
          )}

        {abaAtiva === "duelos" ? (
          <AbaTabelaDuelos
            seasonId={seasonId}
            tierId={serieVisualizando}
            driverId={driverId}
            rodadaIndex={rodadaAtiva}
            arenaNome={driver?.branches?.name ?? null}
            onRodadasResolvidas={(total, labels) => {
              setTotalRodadas(total);
              setRotulosRodadas(labels);
            }}
          />
        ) : abaAtiva === "classificacao" ? (
          <AbaClassificacao
            seasonId={seasonId}
            tierId={serieVisualizando ?? temporada?.tier_id ?? null}
            driverId={driverId}
          />
        ) : abaAtiva === "chaveamento" ? (
          <AbaChaveamento
            seasonId={seasonId}
            tierId={serieVisualizando ?? temporada?.tier_id ?? null}
            driverId={driverId}
            faseDestaque={faseDestaqueChaveamento}
          />
        ) : abaAtiva === "artilharia" ? (
          <AbaArtilharia brandId={brandId} seasonId={seasonId} driverId={driverId} />
        ) : abaAtiva === "proximos" ? (
          branchId && driverId ? (
            <AbaProximosCampeonatos branchId={branchId} driverId={driverId} />
          ) : (
            <PlaceholderAba
              label="Próximos Campeonatos"
              descricao="Carregando dados da sua cidade…"
              fontHeading={fontHeading}
            />
          )
        ) : abaAtiva === "noticias" ? (
          <AbaNoticias seasonId={seasonId} />
        ) : abaAtiva === "configuracoes" ? (
          driverId && branchId ? (
            <AbaConfiguracoes
              driverId={driverId}
              seasonId={seasonId}
              branchId={branchId}
              onNavegar={(aba) => selecionarAba(aba)}
            />
          ) : (
            <PlaceholderAba
              label="Configurações"
              descricao="Carregando sua sessão…"
              fontHeading={fontHeading}
            />
          )
        ) : (
          <PlaceholderAba label="" descricao="" fontHeading={fontHeading} />
        )}
      </main>

      <DrawerNavegacao
        aberto={drawerAberto}
        onAbrirChange={setDrawerAberto}
        nomeCampeonato={temporada?.season_name ?? "Campeonato"}
        nomeMotorista={driver?.name ?? "Motorista"}
        photoUrl={photoUrl}
        serieNome={temporada?.tier_name ?? null}
        abaAtiva={abaAtiva}
        onSelecionar={selecionarAba}
        fontHeading={fontHeading}
      />

      <BottomSheetSeries
        aberto={bottomSheetAberto}
        onAbrirChange={setBottomSheetAberto}
        series={series}
        loading={loadingSeries}
        serieMotoristaId={temporada?.tier_id ?? null}
        serieVisualizando={serieVisualizando}
        onSelecionar={(id) => {
          setSerieVisualizando(id);
          setBottomSheetAberto(false);
        }}
        fontHeading={fontHeading}
      />
    </div>
  );
}

/* ───────────────────────── HEADER ───────────────────────── */

interface HeaderProps {
  nomeCampeonato: string;
  fase: FaseCampeonato | null;
  serieNome: string;
  loading: boolean;
  fontHeading?: string;
  onAbrirDrawer: () => void;
  onAbrirSeries: () => void;
  onRefresh: () => void;
}

function HeaderCampeonato({
  nomeCampeonato,
  fase,
  serieNome,
  loading,
  fontHeading,
  onAbrirDrawer,
  onAbrirSeries,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card backdrop-blur border-b border-border">
      <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-3">
        <button
          onClick={onAbrirDrawer}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p
                className="font-bold text-sm truncate"
                style={{ fontFamily: fontHeading }}
              >
                {nomeCampeonato}
              </p>
            )}
          </div>
          {fase && <BadgeFaseTemporada fase={fase} />}
        </div>

        <button
          onClick={onAbrirSeries}
          className="h-9 px-2 rounded-lg flex items-center gap-1 bg-muted hover:bg-accent text-xs font-semibold transition-colors"
          aria-label="Trocar série"
        >
          <span className="truncate max-w-[80px]">{serieNome}</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        <button
          onClick={onRefresh}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Atualizar"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

/* ──────────────────────── SUB-HEADER ─────────────────────── */

function SubHeaderRodada({
  rotulo,
  onAnterior,
  onProxima,
}: {
  rotulo: string;
  onAnterior: () => void;
  onProxima: () => void;
}) {
  return (
    <div className="sticky top-[57px] z-30 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
        <button
          onClick={onAnterior}
          className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Rodada anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold tracking-wide uppercase text-muted-foreground">
          {rotulo}
        </p>
        <button
          onClick={onProxima}
          className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Próxima rodada"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── DRAWER ────────────────────────── */

interface DrawerProps {
  aberto: boolean;
  onAbrirChange: (v: boolean) => void;
  nomeCampeonato: string;
  nomeMotorista: string;
  photoUrl: string | null;
  serieNome: string | null;
  abaAtiva: AbaId;
  onSelecionar: (aba: AbaId) => void;
  fontHeading?: string;
}

function DrawerNavegacao({
  aberto,
  onAbrirChange,
  nomeCampeonato,
  nomeMotorista,
  photoUrl,
  serieNome,
  abaAtiva,
  onSelecionar,
  fontHeading,
}: DrawerProps) {
  return (
    <Sheet open={aberto} onOpenChange={onAbrirChange}>
      <SheetContent
        side="left"
        className="tema-campeonato w-full max-w-[280px] p-0 bg-background text-foreground border-border"
      >
        <div className="flex flex-col h-full">
          {/* Cabeçalho */}
          <div className="px-4 pt-6 pb-4 border-b border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <p
                className="font-bold text-sm truncate"
                style={{ fontFamily: fontHeading }}
              >
                {nomeCampeonato}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <AvatarMotorista nome={nomeMotorista} url={photoUrl} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{nomeMotorista}</p>
                {serieNome && (
                  <Badge className="mt-1 bg-primary text-primary-foreground hover:bg-primary text-[10px]">
                    {serieNome}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Itens */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {ITENS_NAVEGACAO.map((item) => {
              const ativo = abaAtiva === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelecionar(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    ativo
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="my-2 border-t border-border" />

            <button
              onClick={() => onSelecionar("configuracoes")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                abaAtiva === "configuracoes"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </button>
          </nav>

          {/* Rodapé */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Campeonato · {(import.meta as any).env?.VITE_APP_VERSION ?? "v1.0"}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────────── BOTTOM SHEET SÉRIES ───────────────── */

interface BottomSheetProps {
  aberto: boolean;
  onAbrirChange: (v: boolean) => void;
  series: SerieResumo[];
  loading: boolean;
  serieMotoristaId: string | null;
  serieVisualizando: string | null;
  onSelecionar: (id: string) => void;
  fontHeading?: string;
}

function BottomSheetSeries({
  aberto,
  onAbrirChange,
  series,
  loading,
  serieMotoristaId,
  serieVisualizando,
  onSelecionar,
  fontHeading,
}: BottomSheetProps) {
  // Série do motorista no topo, demais em ordem natural
  const ordenadas = useMemo(() => {
    if (!serieMotoristaId) return series;
    const minha = series.find((s) => s.id === serieMotoristaId);
    const outras = series.filter((s) => s.id !== serieMotoristaId);
    return minha ? [minha, ...outras] : series;
  }, [series, serieMotoristaId]);

  return (
    <Sheet open={aberto} onOpenChange={onAbrirChange}>
      <SheetContent
        side="bottom"
        className="tema-campeonato bg-background text-foreground border-border max-h-[60vh] overflow-y-auto"
      >
        <div className="max-w-lg mx-auto py-2">
          <p
            className="text-base font-bold mb-3"
            style={{ fontFamily: fontHeading }}
          >
            Escolher série
          </p>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ordenadas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma série disponível ainda.
            </p>
          ) : (
            <ul className="space-y-1">
              {ordenadas.map((s) => {
                const ativo = serieVisualizando === s.id;
                const ehMinha = serieMotoristaId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => onSelecionar(s.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors ${
                        ativo
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      <span>{s.tier_name}</span>
                      {ehMinha && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            ativo
                              ? "border-primary-foreground/40 text-primary-foreground"
                              : "border-primary/40 text-primary"
                          }`}
                        >
                          Sua série
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────────── PLACEHOLDER DAS ABAS ──────────────── */

function PlaceholderAba({
  label,
  descricao,
  fontHeading,
}: {
  label: string;
  descricao: string;
  fontHeading?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Construction className="h-8 w-8 text-muted-foreground" />
      </div>
      <p
        className="text-base font-bold mb-1"
        style={{ fontFamily: fontHeading }}
      >
        {label}
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">{descricao}</p>
    </div>
  );
}