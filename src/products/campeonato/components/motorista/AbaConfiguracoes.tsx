import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Trophy, ListChecks, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { AvatarMotorista } from "../shared/AvatarMotorista";
import { useFotoPerfilMotorista } from "../../hooks/useFotoPerfilMotorista";
import { useMinhasInscricoes } from "../../hooks/hook_minhas_inscricoes";
import { uploadFotoMotorista } from "../../utils/upload_foto_motorista";
import type { AbaId } from "../../types/tipos_navegacao_motorista";

interface Props {
  driverId: string;
  seasonId: string | null;
  branchId: string;
  onNavegar: (aba: AbaId) => void;
}

export default function AbaConfiguracoes({
  driverId,
  branchId: _branchId,
  onNavegar,
}: Props) {
  return (
    <div className="space-y-6">
      <SecaoMinhaConta driverId={driverId} />
      <SecaoMinhasInscricoes driverId={driverId} />
      <SecaoSobreCampeonato onNavegar={onNavegar} />
    </div>
  );
}

/* ─────────────── Seção 1: Minha conta ─────────────── */

function SecaoMinhaConta({ driverId }: { driverId: string }) {
  const queryClient = useQueryClient();
  const { driver } = useDriverSession();
  const { photoUrl } = useFotoPerfilMotorista(driverId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  function abrirSeletor() {
    inputRef.current?.click();
  }

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const brandId = driver?.brand_id;
    if (!brandId) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    setEnviando(true);
    const res = await uploadFotoMotorista({ driverId, brandId, file });
    setEnviando(false);

    if (!res.sucesso) {
      toast.error(res.mensagemErro ?? "Não foi possível enviar a foto.");
      return;
    }
    toast.success("Foto atualizada!");
    queryClient.invalidateQueries({ queryKey: ["foto-perfil-motorista", driverId] });
    queryClient.invalidateQueries({ queryKey: ["foto-perfil-motorista"] });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-bold mb-3 text-foreground">Minha conta</h2>
      <div className="flex items-center gap-3">
        <AvatarMotorista nome={driver?.name ?? "Motorista"} url={photoUrl} size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {driver?.name ?? "Motorista"}
          </p>
          {driver?.branches?.name && (
            <p className="text-[11px] text-muted-foreground truncate">
              {driver.branches.name}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleArquivo}
      />

      <Button
        onClick={abrirSeletor}
        variant="outline"
        size="sm"
        className="mt-4 w-full"
        disabled={enviando}
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            Alterar foto
          </>
        )}
      </Button>
    </section>
  );
}

/* ─────────────── Seção 2: Minhas inscrições ─────────────── */

function SecaoMinhasInscricoes({ driverId }: { driverId: string }) {
  const { data, isLoading, isError } = useMinhasInscricoes(driverId);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Minhas inscrições</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-xs text-destructive">
          Não foi possível carregar suas inscrições.
        </p>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Você ainda não tem inscrições.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-2 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {i.season_name ?? "Campeonato"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(i.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <BadgeStatus status={i.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BadgeStatus({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/30">
        Aprovada
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30">
        Aguardando
      </Badge>
    );
  }
  return <Badge variant="destructive">Recusada</Badge>;
}

/* ─────────────── Seção 3: Sobre o campeonato ─────────────── */

function SecaoSobreCampeonato({ onNavegar }: { onNavegar: (aba: AbaId) => void }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Sobre o campeonato</h2>
      </div>

      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
        <li>Cada corrida conta como 1 ponto no duelo</li>
        <li>Duelos duram 24h (fase de classificação)</li>
        <li>4 melhores sobem de série, 4 piores descem</li>
        <li>Mata-mata: duração configurada por fase</li>
      </ul>

      <Button
        variant="outline"
        size="sm"
        className="mt-4 w-full"
        onClick={() => onNavegar("chaveamento")}
      >
        <Trophy className="h-4 w-4 mr-2" />
        Ver chaveamento
      </Button>
    </section>
  );
}