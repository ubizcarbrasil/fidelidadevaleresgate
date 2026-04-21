import { useState } from "react";
import { Check, Monitor } from "lucide-react";
import type { LandingScreenshot } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  screenshots: LandingScreenshot[];
  heroImageUrl?: string;
  productName: string;
  primaryColor: string;
}

const TABS_DEFAULT = [
  {
    label: "Dashboard do Duelo",
    bullets: [
      "Visão consolidada dos duelos ativos por cidade",
      "Métricas de adesão e retenção em tempo real",
      "Filtros por motorista, período e tipo de disputa",
    ],
  },
  {
    label: "Ranking ao vivo",
    bullets: [
      "Top 10 da cidade atualizando a cada corrida",
      "Comparativo semanal, mensal e all-time",
      "Visibilidade pública para gerar pertencimento",
    ],
  },
  {
    label: "Cinturão da Cidade",
    bullets: [
      "Troféu simbólico que muda de mão a cada disputa",
      "Histórico completo de campeões da cidade",
      "Premiação automática em pontos do programa",
    ],
  },
  {
    label: "Acompanhamento ao vivo",
    bullets: [
      "Torcida e palpites sociais durante o duelo",
      "Notificações push para a base inteira",
      "Replay e estatísticas pós-disputa",
    ],
  },
];

export default function BlocoPreviewApp({
  screenshots,
  heroImageUrl,
  productName,
  primaryColor,
}: Props) {
  const items = (screenshots ?? []).filter((s) => s.url);
  const fallback = !items.length && heroImageUrl ? [{ url: heroImageUrl, caption: productName }] : [];
  const finalItems = items.length > 0 ? items : fallback;
  const [tabAtiva, setTabAtiva] = useState(0);

  const tabs = TABS_DEFAULT.slice(0, Math.max(1, Math.min(TABS_DEFAULT.length, finalItems.length || TABS_DEFAULT.length)));
  const currentTab = tabs[tabAtiva] ?? tabs[0];
  const currentImage = finalItems[tabAtiva] ?? finalItems[0];

  return (
    <section id="preview" className="px-4 py-16 sm:py-24 bg-muted/30 scroll-mt-20 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="max-w-6xl mx-auto space-y-10 relative">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
            Demonstração
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Veja o {productName} <span style={{ color: primaryColor }}>na prática</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Interface administrativa pensada para times de operação. Experiência do motorista pensada para virar hábito.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {tabs.map((tab, i) => {
            const isActive = i === tabAtiva;
            return (
              <button
                key={tab.label}
                onClick={() => setTabAtiva(i)}
                className="text-sm font-semibold px-4 py-2 rounded-full border transition-all"
                style={{
                  borderColor: isActive ? primaryColor : `${primaryColor}33`,
                  backgroundColor: isActive ? primaryColor : "transparent",
                  color: isActive ? "#fff" : "inherit",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 items-center">
          {/* Bullets */}
          <div className="space-y-5">
            <h3 className="font-bold text-xl sm:text-2xl leading-tight">
              {currentTab.label}
            </h3>
            <ul className="space-y-3">
              {currentTab.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${primaryColor}22` }}
                  >
                    <Check className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                  </span>
                  <span className="font-medium leading-relaxed pt-0.5">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Imagem em frame premium estilo browser */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 blur-3xl opacity-30 rounded-[2rem]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, transparent 60%)`,
              }}
            />
            <div
              className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden"
              style={{ borderColor: `${primaryColor}40` }}
            >
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/50">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <span className="ml-3 text-[10px] text-muted-foreground font-mono inline-flex items-center gap-1.5">
                  <Monitor className="h-3 w-3" />
                  {currentTab.label}
                </span>
              </div>
              {currentImage ? (
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || currentTab.label}
                  className="w-full aspect-[16/10] object-cover bg-card"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full aspect-[16/10] flex items-center justify-center text-sm text-muted-foreground"
                  style={{ backgroundColor: `${primaryColor}08` }}
                >
                  Visualização em breve
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}