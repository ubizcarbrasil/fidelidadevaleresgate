/**
 * Sheet para o motorista editar seu perfil público (nickname + foto) nos duelos.
 */
import React, { useState, useRef } from "react";
import { ArrowLeft, User, Save, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useDuelParticipation, useUpdateNickname, useUpdateAvatar } from "./hook_duelos";
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
  const updateAvatar = useUpdateAvatar();

  const [nickname, setNickname] = useState(participant?.public_nickname || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSaving = updateNickname.isPending || updateAvatar.isPending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length > 20) {
      toast.error("Máximo 20 caracteres");
      return;
    }
    if (trimmed && contemPalavraOfensiva(trimmed)) {
      toast.error("Apelido contém palavras inadequadas");
      return;
    }

    try {
      if (pendingFile) {
        await updateAvatar.mutateAsync(pendingFile);
        setPendingFile(null);
      }
      await updateNickname.mutateAsync(trimmed || null);
      onBack();
    } catch {
      // errors handled by mutation hooks
    }
  };

  const avatarSrc = previewUrl || participant?.avatar_url;
  const initial = (participant?.public_nickname || participant?.display_name || driver?.name || "M").charAt(0).toUpperCase();

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
        {/* Avatar com upload */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-24 w-24 rounded-full overflow-hidden group"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex items-center justify-center h-full w-full text-3xl font-bold" style={{ color: "hsl(var(--primary))" }}>
                {initial}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {updateAvatar.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">Toque para trocar a foto</p>
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
          disabled={isSaving}
          className="w-full gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Salvando..." : "Salvar Perfil"}
        </Button>
      </div>
    </div>
  );
}
