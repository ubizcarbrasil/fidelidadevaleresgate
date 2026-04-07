/**
 * Sheet para o motorista editar seu apelido público (nickname) nos duelos.
 */
import React, { useState } from "react";
import { ArrowLeft, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useDuelParticipation, useUpdateNickname } from "./hook_duelos";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

const PALAVRAS_BLOQUEADAS = ["puta", "fdp", "caralho", "merda", "viado", "buceta", "piroca", "cuzao", "arrombado"];

function contemPalavraOfensiva(texto: string): boolean {
  const lower = texto.toLowerCase();
  return PALAVRAS_BLOQUEADAS.some((p) => lower.includes(p));
}

export default function PerfilMotoristaSheet({ onBack }: Props) {
  const { driver } = useDriverSession();
  const { participant } = useDuelParticipation();
  const updateNickname = useUpdateNickname();

  const [nickname, setNickname] = useState(participant?.public_nickname || "");

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (trimmed.length > 20) {
      toast.error("Máximo 20 caracteres");
      return;
    }
    if (trimmed && contemPalavraOfensiva(trimmed)) {
      toast.error("Apelido contém palavras inadequadas");
      return;
    }
    updateNickname.mutate(trimmed || null, {
      onSuccess: () => onBack(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Meu Perfil de Duelos
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-5">
        {/* Avatar placeholder */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
          >
            {participant?.avatar_url ? (
              <img src={participant.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              (participant?.public_nickname || participant?.display_name || driver?.name || "M").charAt(0).toUpperCase()
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {(participant as any)?.display_name || driver?.name?.replace(/\[MOTORISTA\]\s*/gi, "").trim() || "Motorista"}
          </p>
        </div>

        {/* Nickname field */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <label className="text-sm font-medium text-foreground">
            Apelido público
          </label>
          <Input
            placeholder="Ex: Rei da Estrada"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="rounded-xl bg-muted border-0"
          />
          <p className="text-[11px] text-muted-foreground">
            Esse apelido será visível para outros motoristas nos duelos e no ranking. Máx. 20 caracteres.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateNickname.isPending}
          className="w-full gap-2"
        >
          <Save className="h-4 w-4" />
          {updateNickname.isPending ? "Salvando..." : "Salvar Apelido"}
        </Button>
      </div>
    </div>
  );
}
