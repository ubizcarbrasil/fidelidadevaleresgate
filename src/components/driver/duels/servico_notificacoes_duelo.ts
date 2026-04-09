/**
 * Serviço de disparo de notificações internas para eventos de duelo.
 * Utiliza a edge function send-push-notification existente.
 */
import { supabase } from "@/integrations/supabase/client";

type TipoNotificacaoDuelo =
  | "DUEL_CHALLENGE_RECEIVED"
  | "DUEL_CHALLENGE_ACCEPTED"
  | "DUEL_CHALLENGE_DECLINED"
  | "DUEL_COUNTER_PROPOSAL"
  | "DUEL_STARTED"
  | "DUEL_LEAD_CHANGE"
  | "DUEL_FINISHED"
  | "DUEL_VICTORY"
  | "DUEL_DEFEAT"
  | "DUEL_DRAW"
  | "RANKING_TOP10_ENTRY"
  | "BELT_NEW_CHAMPION"
  | "SIDE_BET_CREATED"
  | "SIDE_BET_ACCEPTED";

interface MapeamentoNotificacao {
  titulo: (nome?: string) => string;
  corpo: (nome?: string) => string;
  referenceType: string;
}

const MAPEAMENTO: Record<TipoNotificacaoDuelo, MapeamentoNotificacao> = {
  DUEL_CHALLENGE_RECEIVED: {
    titulo: () => "Você recebeu um desafio! 🥊",
    corpo: (nome) => `${nome || "Alguém"} quer te desafiar. Topa encarar?`,
    referenceType: "duel_challenge",
  },
  DUEL_CHALLENGE_ACCEPTED: {
    titulo: () => "Desafio aceito! 💪",
    corpo: (nome) => `${nome || "O adversário"} aceitou seu desafio. Prepare-se!`,
    referenceType: "duel_accepted",
  },
  DUEL_CHALLENGE_DECLINED: {
    titulo: () => "Desafio recusado 😅",
    corpo: (nome) => `${nome || "O adversário"} arregou do seu desafio`,
    referenceType: "duel_declined",
  },
  DUEL_COUNTER_PROPOSAL: {
    titulo: () => "Contraproposta recebida! 💬",
    corpo: (nome) => `${nome || "O adversário"} fez uma contraproposta de pontos`,
    referenceType: "duel_counter_proposal",
  },
  DUEL_STARTED: {
    titulo: () => "Duelo começou! 🔥",
    corpo: () => "Seu duelo está ao vivo. Bora correr!",
    referenceType: "duel_started",
  },
  DUEL_LEAD_CHANGE: {
    titulo: () => "Ficou para trás! 😤",
    corpo: (nome) => `${nome || "Seu adversário"} assumiu a liderança no duelo`,
    referenceType: "duel_lead",
  },
  DUEL_FINISHED: {
    titulo: () => "Duelo encerrado! 🏁",
    corpo: () => "Confira o resultado do seu duelo",
    referenceType: "duel_finished",
  },
  DUEL_VICTORY: {
    titulo: () => "Você venceu! 🏆",
    corpo: (nome) => `Parabéns! Você derrotou ${nome || "o adversário"} no duelo`,
    referenceType: "duel_victory",
  },
  DUEL_DEFEAT: {
    titulo: () => "Derrota no duelo 😤",
    corpo: () => "Mas a próxima é sua! Desafie de novo 🥊",
    referenceType: "duel_defeat",
  },
  DUEL_DRAW: {
    titulo: () => "Empate no duelo! 🤝",
    corpo: () => "Vocês empataram! Pontos devolvidos. Que tal uma revanche?",
    referenceType: "duel_draw",
  },
  RANKING_TOP10_ENTRY: {
    titulo: () => "Você entrou no Top 10! 🌟",
    corpo: () => "Sua posição no ranking da cidade subiu!",
    referenceType: "ranking_top10",
  },
  BELT_NEW_CHAMPION: {
    titulo: () => "Novo dono do cinturão! 👑",
    corpo: () => "O cinturão da cidade tem um novo campeão!",
    referenceType: "belt_champion",
  },
  SIDE_BET_CREATED: {
    titulo: () => "Nova aposta no seu duelo! 🎯",
    corpo: (nome) => `${nome || "Alguém"} fez uma aposta lateral no seu duelo`,
    referenceType: "side_bet_created",
  },
  SIDE_BET_ACCEPTED: {
    titulo: () => "Aposta aceita! 💰",
    corpo: () => "Sua aposta foi aceita. Pontos reservados!",
    referenceType: "side_bet_accepted",
  },
};

/** Mapeamento de tipos internos para event_type do sistema de fluxos */
const MAPEAMENTO_FLUXO: Partial<Record<TipoNotificacaoDuelo, string>> = {
  DUEL_CHALLENGE_RECEIVED: "DUEL_CHALLENGE_RECEIVED",
  DUEL_CHALLENGE_ACCEPTED: "DUEL_ACCEPTED",
  DUEL_CHALLENGE_DECLINED: "DUEL_DECLINED",
  DUEL_VICTORY: "DUEL_VICTORY",
  DUEL_FINISHED: "DUEL_FINISHED",
  BELT_NEW_CHAMPION: "BELT_NEW_CHAMPION",
};

interface ParamsNotificacao {
  tipo: TipoNotificacaoDuelo;
  customerIds: string[];
  duelId?: string;
  nomeOponente?: string;
  brandId?: string;
  branchId?: string;
}

/**
 * Dispara notificação interna via edge function send-push-notification.
 * Se brandId estiver presente e houver mapeamento de fluxo, também dispara
 * send-driver-message para envio via TaxiMachine.
 * Não lança erro — falhas são logadas silenciosamente.
 */
export async function enviarNotificacaoDuelo({
  tipo,
  customerIds,
  duelId,
  nomeOponente,
  brandId,
  branchId,
}: ParamsNotificacao): Promise<void> {
  if (!customerIds.length) return;

  const mapeamento = MAPEAMENTO[tipo];
  if (!mapeamento) return;

  // 1. Notificação in-app (push notification)
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: {
        customer_ids: customerIds,
        title: mapeamento.titulo(nomeOponente),
        body: mapeamento.corpo(nomeOponente),
        reference_type: mapeamento.referenceType,
        reference_id: duelId || null,
      },
    });
  } catch (err) {
    console.error(`[NotificacaoDuelo] Falha ao enviar push ${tipo}:`, err);
  }

  // 2. Disparo do fluxo de mensagem via TaxiMachine (se configurado)
  const eventType = MAPEAMENTO_FLUXO[tipo];
  if (eventType && brandId) {
    try {
      await supabase.functions.invoke("send-driver-message", {
        body: {
          brand_id: brandId,
          branch_id: branchId || null,
          event_type: eventType,
          customer_ids: customerIds,
          context_vars: {
            adversario: nomeOponente || "",
          },
        },
      });
    } catch (err) {
      console.error(`[NotificacaoDuelo] Falha ao enviar fluxo ${tipo}:`, err);
    }
  }
}
