import { useState } from "react";
import { Trophy, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CAMPEONATO_STANDALONE_KEY,
} from "../constants/constantes_campeonato";
import { useInvalidarCampeonatoStandalone } from "../hooks/hook_campeonato_standalone";

interface Props {
  brandId: string;
}

const BENEFICIOS = [
  "Competição por séries (A, B, C, D...)",
  "Duelos de 24h em tempo real",
  "Mata-mata com chaveamento interativo",
  "Premiação configurável por posição",
];

/**
 * Tela exibida em /campeonato quando o brand ainda não tem
 * `campeonato_standalone_enabled = true`.
 */
export default function PaginaAtivacaoStandalone({ brandId }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const invalidar = useInvalidarCampeonatoStandalone();

  async function ativar() {
    setIsSaving(true);
    try {
      // Lê settings atuais para fazer merge manual (preserva outras chaves).
      const { data: atual, error: errLeitura } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .maybeSingle();
      if (errLeitura) throw errLeitura;

      const settingsAtuais =
        (atual?.brand_settings_json as Record<string, unknown> | null) ?? {};
      const novosSettings = {
        ...settingsAtuais,
        [CAMPEONATO_STANDALONE_KEY]: true,
      };

      const { data, error } = await supabase
        .from("brands")
        .update({ brand_settings_json: novosSettings })
        .eq("id", brandId)
        .select("id, brand_settings_json")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error(
          "Não foi possível ativar. Verifique suas permissões.",
        );
      }

      await invalidar(brandId);
      toast.success("Campeonato ativado!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao ativar Campeonato";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Campeonato</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ative o módulo Campeonato para esta marca
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="w-full"
            onClick={ativar}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ativar Campeonato para esta marca
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Você pode desativar a qualquer momento nas configurações.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}