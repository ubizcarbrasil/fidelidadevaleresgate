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
  /**
   * Tempo em segundos até considerar o boot "travado" e exibir o
   * botão de emergência. Padrão: 20s — só aparece em casos extremos,
   * jamais em rede móvel lenta normal.
   */
  segundosAteBotaoEmergencia?: number;
}

// Lazy: só carrega o botão/dialog se o fallback aparecer após 8s.
const BotaoAtualizarApp = lazy(() => import("./botao_atualizar_app"));

export default function TelaCarregamento({
  mensagem,
  etapas = DEFAULT_ETAPAS,
  logoUrl,
  mostrarBotaoEmergencia = true,
  acompanharBoot = true,
  segundosAteBotaoEmergencia = 20,
}: PropsTelaCarregamento) {
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [travado, setTravado] = useState(false);
  const [faseBoot, setFaseBoot] = useState<BootPhase>(() => getBootPhase());
  const [mostrarTextoDetalhado, setMostrarTextoDetalhado] = useState(false);
  // Adia a renderização visual em 250ms — se o boot terminar antes
  // (caso comum em conexões boas), o usuário não vê o loader piscar.
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisivel(true), 250);
    return () => clearTimeout(id);
  }, []);

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

  // Só mostramos o texto detalhado da fase depois de 2s no mesmo loader,
  // evitando "cascata" de mensagens piscando em boots rápidos (<2s).
  useEffect(() => {
    setMostrarTextoDetalhado(false);
    const id = setTimeout(() => setMostrarTextoDetalhado(true), 2000);
    return () => clearTimeout(id);
  }, []);

  // Rotaciona a mensagem de etapa (apenas quando não há mensagem fixa
  // e o boot machine não está controlando a etapa).
  useEffect(() => {
    if (mensagem || bootAtivo || etapas.length <= 1) return;
    const id = setInterval(() => {
      setIndiceEtapa((i) => (i + 1) % etapas.length);
    }, 2500);
    return () => clearInterval(id);
  }, [mensagem, etapas, bootAtivo]);

  // Após N segundos sem destravar, marcamos como possível travamento.
  // O botão só será exibido se o boot ainda estiver em fase pré-BRAND_READY
  // (travado de verdade). Em Suspense de rota o botão fica oculto.
  useEffect(() => {
    if (!mostrarBotaoEmergencia) return;
    const id = setTimeout(() => setTravado(true), segundosAteBotaoEmergencia * 1000);
    return () => clearTimeout(id);
  }, [mostrarBotaoEmergencia, segundosAteBotaoEmergencia]);

  // Texto exibido: durante os primeiros 2s sempre "Carregando…"; depois,
  // mostra a mensagem detalhada da fase (se boot ativo) ou rotação de etapas.
  const textoEtapa = mensagem
    ?? (mostrarTextoDetalhado
      ? (bootAtivo ? MENSAGENS_POR_FASE[faseBoot] : etapas[indiceEtapa])
      : "Carregando…");

  // Só consideramos o boot "realmente travado" se ainda estamos em fase
  // pré-BRAND_READY após o threshold. Suspense de rota não aciona o botão.
  const fasesPreBoot: BootPhase[] = ["BOOTSTRAP", "AUTH_LOADING", "AUTH_READY", "BRAND_LOADING"];
  const bootRealmenteTravado = travado && bootAtivo && fasesPreBoot.includes(faseBoot);

  // Antes de 250ms, renderiza apenas um placeholder invisível para evitar
  // flash do loader em boots rápidos. Mantém o nó no DOM para a transição.
  if (!visivel) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Carregando aplicação"
        className="fixed inset-0 z-[9999] bg-background"
      />
    );
  }

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

      {bootRealmenteTravado && (
        <div className="mt-4 flex flex-col items-center gap-2 animate-loader-fade">
          <p className="text-xs text-muted-foreground/80">
            Conexão lenta? Você pode tentar atualizar.
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