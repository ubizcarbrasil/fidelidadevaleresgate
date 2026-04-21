import { useEffect, useState, lazy, Suspense } from "react";
import { onBootPhase, getBootPhase, type BootPhase } from "@/lib/bootStateCore";

/**
 * TelaCarregamento — loader premium unificado da plataforma.
 *
 * Substitui os 4 padrões antigos (spinner roxo do bootstrap, Loader2 cinza,
 * border-b-2 border-primary e Loader2 branco translúcido). Alinhado ao
 * design system (dark + primary), respeita prefers-reduced-motion e oferece
 * um botão de emergência "Atualizar agora" após 8s de carregamento.
 */

const LOGO_FALLBACK = "/logo-vale-resgate.png";
const DEFAULT_ETAPAS = [
  "Carregando aplicativo…",
  "Conectando ao servidor…",
  "Quase lá…",
];

/**
 * Mapeia cada fase do boot machine para uma mensagem amigável,
 * exibida em tempo real conforme a inicialização avança.
 */
const MENSAGENS_POR_FASE: Record<BootPhase, string> = {
  BOOTSTRAP: "Iniciando aplicativo…",
  AUTH_LOADING: "Validando sua sessão…",
  AUTH_READY: "Sessão validada. Carregando configurações…",
  BRAND_LOADING: "Carregando configurações da marca…",
  BRAND_READY: "Aplicando tema e preparando dados…",
  APP_MOUNTED: "Pronto!",
  FAILED: "Não foi possível iniciar.",
};

interface PropsTelaCarregamento {
  mensagem?: string;
  etapas?: string[];
  logoUrl?: string;
  mostrarBotaoEmergencia?: boolean;
  /**
   * Quando true (padrão), conecta-se ao boot state machine e exibe
   * a etapa atual em tempo real (validação de sessão, carregando brand…).
   * Use false em loaders de Suspense de páginas internas, onde o boot
   * já terminou e a fase fica "APP_MOUNTED" travada.
   */
  acompanharBoot?: boolean;
}

// Lazy: só carrega o botão/dialog se o fallback aparecer após 8s.
const BotaoAtualizarApp = lazy(() => import("./botao_atualizar_app"));

export default function TelaCarregamento({
  mensagem,
  etapas = DEFAULT_ETAPAS,
  logoUrl,
  mostrarBotaoEmergencia = true,
  acompanharBoot = true,
}: PropsTelaCarregamento) {
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [travado, setTravado] = useState(false);
  const [faseBoot, setFaseBoot] = useState<BootPhase>(() => getBootPhase());

  // Inscreve no boot state machine para atualizar a etapa em tempo real.
  useEffect(() => {
    if (!acompanharBoot) return;
    setFaseBoot(getBootPhase());
    const unsubscribe = onBootPhase((fase) => setFaseBoot(fase));
    return unsubscribe;
  }, [acompanharBoot]);

  // Considera "boot ativo" enquanto não chegou a APP_MOUNTED nem FAILED.
  // Nessas fases finais, voltamos ao ciclo genérico (caso o loader continue
  // visível por algum motivo de Suspense/route).
  const bootAtivo =
    acompanharBoot && faseBoot !== "APP_MOUNTED" && faseBoot !== "FAILED";

  // Rotaciona a mensagem de etapa (apenas quando não há mensagem fixa
  // e o boot machine não está controlando a etapa).
  useEffect(() => {
    if (mensagem || bootAtivo || etapas.length <= 1) return;
    const id = setInterval(() => {
      setIndiceEtapa((i) => (i + 1) % etapas.length);
    }, 2500);
    return () => clearInterval(id);
  }, [mensagem, etapas, bootAtivo]);

  // Após 8s sem destravar, oferece botão de emergência.
  useEffect(() => {
    if (!mostrarBotaoEmergencia) return;
    const id = setTimeout(() => setTravado(true), 8000);
    return () => clearTimeout(id);
  }, [mostrarBotaoEmergencia]);

  const textoEtapa =
    mensagem ??
    (bootAtivo ? MENSAGENS_POR_FASE[faseBoot] : etapas[indiceEtapa]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando aplicação"
      className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center motion-reduce:animate-none"
    >
      {/* Barra indeterminada no topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-loader-bar motion-reduce:animate-none" />
      </div>

      <LogoAneladoLoader logoUrl={logoUrl} />

      <p
        key={textoEtapa}
        className="max-w-xs text-sm font-medium text-muted-foreground animate-loader-fade motion-reduce:animate-none"
      >
        {textoEtapa}
      </p>

      {travado && (
        <div className="mt-4 flex flex-col items-center gap-2 animate-loader-fade">
          <p className="text-xs text-muted-foreground/80">
            Demorando mais que o normal?
          </p>
          <Suspense fallback={null}>
            <BotaoAtualizarApp label="Atualizar agora" />
          </Suspense>
        </div>
      )}
    </div>
  );
}

/**
 * Versão inline: usada dentro de cards/listas onde o full-screen
 * ficaria exagerado. Mantém o mesmo visual (anel + logo opcional)
 * mas ocupa apenas o espaço do container.
 */
export function TelaCarregamentoInline({
  mensagem,
  className,
}: {
  mensagem?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={mensagem ?? "Carregando"}
      className={
        "flex min-h-[160px] flex-col items-center justify-center gap-3 py-8 " +
        (className ?? "")
      }
    >
      <AnelGiratorio tamanho={40} />
      {mensagem && (
        <p className="text-xs text-muted-foreground">{mensagem}</p>
      )}
    </div>
  );
}

/* ─── subcomponentes ─── */

function LogoAneladoLoader({ logoUrl }: { logoUrl?: string }) {
  const [erroLogo, setErroLogo] = useState(false);
  const src = !erroLogo && logoUrl ? logoUrl : LOGO_FALLBACK;

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <AnelGiratorio tamanho={96} />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onError={() => setErroLogo(true)}
        className="absolute h-12 w-12 rounded-full object-contain animate-loader-pulse-soft motion-reduce:animate-none"
      />
    </div>
  );
}

function AnelGiratorio({ tamanho }: { tamanho: number }) {
  const stroke = Math.max(2, Math.round(tamanho / 32));
  const r = (tamanho - stroke) / 2;
  const c = tamanho / 2;
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      className="animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${tamanho}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="hsl(var(--primary) / 0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={`url(#grad-${tamanho})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${Math.round(2 * Math.PI * r * 0.35)} ${Math.round(2 * Math.PI * r)}`}
      />
    </svg>
  );
}