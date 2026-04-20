import { useState } from "react";
import {
  FileText,
  Calendar,
  Smartphone,
  Hash,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDriverProfile } from "../hooks/hook_perfil_motorista";
import {
  formatarTexto,
  formatarData,
  formatarDataHora,
  formatarBooleano,
  cnhVencida,
} from "../utils/formatadores_motorista";
import CardFichaMotorista from "./componentes/CardFichaMotorista";
import LinhaInfo from "./componentes/LinhaInfo";

interface Props {
  driverId: string;
}

export default function AbaDocumentacaoMotorista({ driverId }: Props) {
  const { data: perfil, isLoading } = useDriverProfile(driverId);
  const [observacoesAbertas, setObservacoesAbertas] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando documentação...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhum dado de documentação cadastrado.
          <br />
          <span className="text-xs">
            Importe a planilha do TaxiMachine para popular estes dados.
          </span>
        </p>
      </div>
    );
  }

  const cnhExpirada = cnhVencida(perfil.cnh_expiration);
  const temObservacoes =
    perfil.internal_note_1 || perfil.internal_note_2 || perfil.internal_note_3 || perfil.extra_data;

  return (
    <div className="space-y-4">
      {/* CARD: CNH */}
      <CardFichaMotorista
        titulo="CNH"
        acao={
          cnhExpirada && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              Vencida
            </Badge>
          )
        }
      >
        <LinhaInfo icon={Hash} label="Número" value={formatarTexto(perfil.cnh_number)} />
        <LinhaInfo
          icon={Calendar}
          label="Vencimento"
          value={formatarData(perfil.cnh_expiration)}
          destaque={cnhExpirada ? "alerta" : "default"}
        />
        <LinhaInfo icon={FileText} label="EAR" value={formatarBooleano(perfil.has_ear)} />
      </CardFichaMotorista>

      {/* CARD: EQUIPAMENTO */}
      <CardFichaMotorista titulo="Equipamento">
        <LinhaInfo icon={Smartphone} label="IMEI 1" value={formatarTexto(perfil.imei_1)} />
        <LinhaInfo icon={Smartphone} label="IMEI 2" value={formatarTexto(perfil.imei_2)} />
        <LinhaInfo icon={Hash} label="VTR" value={formatarTexto(perfil.vtr)} />
        <LinhaInfo icon={Smartphone} label="App" value={formatarTexto(perfil.app_version)} />
      </CardFichaMotorista>

      {/* CARD: STATUS DETALHADO */}
      <CardFichaMotorista titulo="Histórico de Status">
        <LinhaInfo
          icon={Calendar}
          label="Status em"
          value={formatarDataHora(perfil.registration_status_at)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={Calendar}
          label="Bloqueado até"
          value={formatarData(perfil.blocked_until)}
          labelWidth="w-28"
          destaque={perfil.blocked_until ? "alerta" : "default"}
        />
        <LinhaInfo
          icon={AlertTriangle}
          label="Motivo bloq."
          value={formatarTexto(perfil.block_reason)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={Clock}
          label="Última atividade"
          value={formatarDataHora(perfil.last_activity_at)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={UserPlus}
          label="Indicado por"
          value={formatarTexto(perfil.referred_by)}
          labelWidth="w-28"
        />
      </CardFichaMotorista>

      {/* CARD: OBSERVAÇÕES (colapsável) */}
      {temObservacoes && (
        <CardFichaMotorista
          titulo="Observações Internas"
          acao={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setObservacoesAbertas((v) => !v)}
            >
              {observacoesAbertas ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          }
        >
          {observacoesAbertas ? (
            <div className="space-y-3 text-sm">
              {perfil.internal_note_1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nota 1</p>
                  <p className="whitespace-pre-wrap">{perfil.internal_note_1}</p>
                </div>
              )}
              {perfil.internal_note_2 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nota 2</p>
                  <p className="whitespace-pre-wrap">{perfil.internal_note_2}</p>
                </div>
              )}
              {perfil.internal_note_3 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nota 3</p>
                  <p className="whitespace-pre-wrap">{perfil.internal_note_3}</p>
                </div>
              )}
              {perfil.extra_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dados extras</p>
                  <p className="whitespace-pre-wrap text-xs">{perfil.extra_data}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Clique no ícone para expandir as observações.
            </p>
          )}
        </CardFichaMotorista>
      )}

      {/* RODAPÉ: AUDITORIA */}
      <div className="text-xs text-muted-foreground/70 text-center pt-2">
        Última importação: {formatarDataHora(perfil.imported_at)}
      </div>
    </div>
  );
}
