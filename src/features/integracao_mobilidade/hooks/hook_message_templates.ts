import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export type MessageTemplate = {
  id: string;
  brand_id: string;
  name: string;
  body_template: string;
  available_vars: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const QUERY_KEY = "driver-message-templates";

/* ── Templates padrão: 3 por categoria ── */
const DEFAULT_TEMPLATES: Omit<MessageTemplate, "id" | "brand_id" | "created_at" | "updated_at">[] = [
  // Duelo
  {
    name: "Desafio recebido",
    body_template: "⚔️ {{nome}}, você recebeu um desafio de {{adversario}}! O duelo vale {{premio}} pontos. Prepare-se e mostre quem manda na {{cidade}}!",
    available_vars: ["nome", "adversario", "premio", "cidade"],
    category: "duel",
    is_active: true,
  },
  {
    name: "Duelo iniciado",
    body_template: "🏁 {{nome}}, seu duelo contra {{adversario}} começou AGORA! São {{corridas}} corridas para decidir o vencedor. Boa sorte na {{cidade}}!",
    available_vars: ["nome", "adversario", "corridas", "cidade"],
    category: "duel",
    is_active: true,
  },
  {
    name: "Resultado do duelo",
    body_template: "🏆 {{nome}}, o duelo contra {{adversario}} terminou! Você fez {{corridas}} corridas. Confira o resultado e resgate seus {{premio}} pontos!",
    available_vars: ["nome", "adversario", "corridas", "premio"],
    category: "duel",
    is_active: true,
  },
  // Cinturão
  {
    name: "Novo campeão do cinturão",
    body_template: "👑 {{nome}}, você conquistou o CINTURÃO da {{cidade}}! Seu recorde de {{corridas}} corridas é o novo marco. Defenda seu título!",
    available_vars: ["nome", "corridas", "cidade"],
    category: "belt",
    is_active: true,
  },
  {
    name: "Cinturão em disputa",
    body_template: "🥊 {{nome}}, o cinturão da {{cidade}} está em jogo! O recorde atual é de {{corridas}} corridas. Supere para se tornar o novo campeão e ganhar {{premio}} pontos!",
    available_vars: ["nome", "corridas", "cidade", "premio"],
    category: "belt",
    is_active: true,
  },
  {
    name: "Cinturão perdido",
    body_template: "😤 {{nome}}, você perdeu o cinturão da {{cidade}}! {{adversario}} bateu seu recorde com {{corridas}} corridas. Hora da revanche!",
    available_vars: ["nome", "adversario", "corridas", "cidade"],
    category: "belt",
    is_active: true,
  },
  // Promoção
  {
    name: "Promoção especial",
    body_template: "🎉 {{nome}}, temos uma promoção exclusiva para você na {{cidade}}! Complete corridas e ganhe pontos em dobro. Não perca!",
    available_vars: ["nome", "cidade"],
    category: "promotion",
    is_active: true,
  },
  {
    name: "Bônus de corridas",
    body_template: "🚀 {{nome}}, complete {{corridas}} corridas hoje e ganhe {{pontos}} pontos extras! Válido apenas hoje na {{cidade}}.",
    available_vars: ["nome", "corridas", "pontos", "cidade"],
    category: "promotion",
    is_active: true,
  },
  {
    name: "Recompensa de fidelidade",
    body_template: "⭐ {{nome}}, parabéns! Seu saldo atual é de {{saldo}} pontos. Continue correndo na {{cidade}} e troque por prêmios incríveis!",
    available_vars: ["nome", "saldo", "cidade"],
    category: "promotion",
    is_active: true,
  },
  // Geral
  {
    name: "Boas-vindas",
    body_template: "👋 Bem-vindo, {{nome}}! Você agora faz parte do programa de pontos da {{cidade}}. Cada corrida vale pontos que viram prêmios!",
    available_vars: ["nome", "cidade"],
    category: "general",
    is_active: true,
  },
  {
    name: "Aviso geral",
    body_template: "📢 {{nome}}, temos um recado importante para os motoristas da {{cidade}}. Fique atento às novidades no seu painel!",
    available_vars: ["nome", "cidade"],
    category: "general",
    is_active: true,
  },
  {
    name: "Lembrete de resgate",
    body_template: "🎁 {{nome}}, você tem {{saldo}} pontos disponíveis! Já conferiu as ofertas de resgate na {{cidade}}? Não deixe seus pontos parados!",
    available_vars: ["nome", "saldo", "cidade"],
    category: "general",
    is_active: true,
  },
  // Pontuação
  {
    name: "Pontos recebidos",
    body_template: "✅ {{nome}}, você recebeu {{pontos}} pontos pela sua corrida na {{cidade}}! Saldo atual: {{saldo}} pontos.",
    available_vars: ["nome", "pontos", "saldo", "cidade"],
    category: "scoring",
    is_active: true,
  },
  {
    name: "Meta de pontos atingida",
    body_template: "🎯 {{nome}}, parabéns! Você atingiu {{pontos}} pontos acumulados na {{cidade}}. Continue assim e suba no ranking!",
    available_vars: ["nome", "pontos", "cidade"],
    category: "scoring",
    is_active: true,
  },
  {
    name: "Resumo de pontuação",
    body_template: "📊 {{nome}}, seu resumo: {{corridas}} corridas realizadas, {{pontos}} pontos ganhos. Saldo disponível: {{saldo}}. Bora, {{cidade}}!",
    available_vars: ["nome", "corridas", "pontos", "saldo", "cidade"],
    category: "scoring",
    is_active: true,
  },
];

export function useMessageTemplates(brandId: string | null) {
  const queryClient = useQueryClient();
  const seedingRef = useRef(false);

  const query = useQuery({
    queryKey: [QUERY_KEY, brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("driver_message_templates")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MessageTemplate[];
    },
    enabled: !!brandId,
  });

  // Auto-seed default templates when brand has none
  useEffect(() => {
    if (!brandId || query.isLoading || seedingRef.current) return;
    if (query.data && query.data.length === 0) {
      seedingRef.current = true;
      const rows = DEFAULT_TEMPLATES.map((t) => ({ ...t, brand_id: brandId }));
      (supabase as any)
        .from("driver_message_templates")
        .insert(rows)
        .then(({ error }: any) => {
          if (!error) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
          }
          seedingRef.current = false;
        });
    }
  }, [brandId, query.data, query.isLoading, queryClient]);

  const upsertMutation = useMutation({
    mutationFn: async (template: Partial<MessageTemplate> & { brand_id: string }) => {
      if (template.id) {
        const { id, created_at, updated_at, ...rest } = template as any;
        const { error } = await (supabase as any)
          .from("driver_message_templates")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("driver_message_templates")
          .insert(template);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
      toast({ title: "Template salvo com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar template", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await (supabase as any)
        .from("driver_message_templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
      toast({ title: "Template removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover template", description: err.message, variant: "destructive" });
    },
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    upsertTemplate: upsertMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}
