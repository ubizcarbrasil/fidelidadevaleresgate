import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import type { ValidacaoCidade, ResultadoValidacao } from "../types/tipos_onboarding";

const OK: (msg: string) => ResultadoValidacao = (msg) => ({
  status: "concluida", mensagem: msg,
});
const PEND: (msg: string) => ResultadoValidacao = (msg) => ({
  status: "pendente", mensagem: msg,
});
const ERRO: (msg: string, detalhe?: string) => ResultadoValidacao = (msg, d) => ({
  status: "erro", mensagem: msg, detalhe: d,
});
const NA: ResultadoValidacao = { status: "nao_aplicavel", mensagem: "Não aplicável para este modelo" };

export function useValidacaoCidade(branchId: string | null) {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["city-onboarding-validation", currentBrandId, branchId],
    enabled: !!currentBrandId && !!branchId,
    refetchInterval: 15_000,
    queryFn: async (): Promise<ValidacaoCidade> => {
      // 1. Branch info
      const { data: branch } = await supabase
        .from("branches")
        .select("id, name, scoring_model, is_active")
        .eq("id", branchId!)
        .single();

      if (!branch) {
        const base: ResultadoValidacao = PEND("Cidade não encontrada");
        return {
          cidadeCriada: base, modeloNegocio: base, parceiros: base,
          regrasPontos: base, integracaoMobilidade: base, carteiraPontos: base,
          ofertasAtivas: base,
        };
      }

      const modelo = branch.scoring_model as string;
      const isDriver = modelo === "DRIVER_ONLY" || modelo === "BOTH";
      const isPassenger = modelo === "PASSENGER_ONLY" || modelo === "BOTH";

      // Parallel queries
      const [storesRes, offersRes, walletRes, integrationRes, pointsRulesRes, driverRulesRes] =
        await Promise.all([
          supabase
            .from("stores")
            .select("id", { count: "exact", head: true })
            .eq("branch_id", branchId!)
            .eq("brand_id", currentBrandId!)
            .eq("is_active", true),
          supabase
            .from("offers")
            .select("id", { count: "exact", head: true })
            .eq("branch_id", branchId!)
            .eq("brand_id", currentBrandId!)
            .eq("is_active", true)
            .eq("status", "ACTIVE"),
          supabase
            .from("branch_points_wallet")
            .select("balance")
            .eq("branch_id", branchId!)
            .maybeSingle(),
          supabase
            .from("machine_integrations")
            .select("id, is_active, api_key, webhook_registered")
            .eq("branch_id", branchId!)
            .maybeSingle(),
          supabase
            .from("points_rules")
            .select("id", { count: "exact", head: true })
            .eq("branch_id", branchId!)
            .eq("is_active", true),
          supabase
            .from("driver_points_rules")
            .select("id", { count: "exact", head: true })
            .eq("branch_id", branchId!)
            .eq("is_active", true),
        ]);

      // Evaluate each step
      const cidadeCriada: ResultadoValidacao = branch.is_active
        ? OK(`Cidade "${branch.name}" criada e ativa`)
        : ERRO("Cidade criada mas inativa", "Ative a cidade em Minhas Cidades");

      const modeloNegocio: ResultadoValidacao = modelo
        ? OK(`Modelo: ${modelo.replace(/_/g, " ")}`)
        : PEND("Modelo de negócio não definido");

      const storeCount = storesRes.count ?? 0;
      const parceiros: ResultadoValidacao = storeCount > 0
        ? OK(`${storeCount} parceiro(s) ativo(s)`)
        : PEND("Nenhum parceiro ativo cadastrado");

      // Points rules
      let regrasPontos: ResultadoValidacao;
      if (isPassenger) {
        const prCount = pointsRulesRes.count ?? 0;
        regrasPontos = prCount > 0
          ? OK(`${prCount} regra(s) de pontos ativa(s)`)
          : PEND("Nenhuma regra de pontos configurada");
      } else if (isDriver) {
        const drCount = driverRulesRes.count ?? 0;
        regrasPontos = drCount > 0
          ? OK(`${drCount} regra(s) de pontos de motorista ativa(s)`)
          : PEND("Nenhuma regra de pontos de motorista configurada");
      } else {
        regrasPontos = PEND("Defina o modelo de negócio primeiro");
      }

      // Integration
      let integracaoMobilidade: ResultadoValidacao;
      if (!isDriver) {
        integracaoMobilidade = NA;
      } else if (!integrationRes.data) {
        integracaoMobilidade = PEND("Integração não configurada");
      } else if (!integrationRes.data.is_active) {
        integracaoMobilidade = ERRO("Integração inativa", "Ative a integração em Integração Mobilidade");
      } else if (!integrationRes.data.api_key) {
        integracaoMobilidade = ERRO("API Key não preenchida");
      } else {
        integracaoMobilidade = OK(
          integrationRes.data.webhook_registered
            ? "Integração ativa com webhook registrado"
            : "Integração ativa (webhook pendente)"
        );
      }

      // Wallet
      let carteiraPontos: ResultadoValidacao;
      if (!isDriver) {
        carteiraPontos = NA;
      } else if (!walletRes.data) {
        carteiraPontos = ERRO("Carteira de pontos não encontrada");
      } else {
        const balance = walletRes.data.balance ?? 0;
        carteiraPontos = balance > 0
          ? OK(`Saldo: ${Number(balance).toLocaleString("pt-BR")} pts`)
          : ERRO(`Saldo: ${Number(balance).toLocaleString("pt-BR")} pts`, "Recomendamos carregar saldo antes de operar");
      }

      // Offers
      let ofertasAtivas: ResultadoValidacao;
      if (!isPassenger) {
        ofertasAtivas = NA;
      } else {
        const offerCount = offersRes.count ?? 0;
        ofertasAtivas = offerCount > 0
          ? OK(`${offerCount} oferta(s) ativa(s)`)
          : PEND("Nenhuma oferta ativa cadastrada");
      }

      return {
        cidadeCriada, modeloNegocio, parceiros, regrasPontos,
        integracaoMobilidade, carteiraPontos, ofertasAtivas,
      };
    },
  });
}
