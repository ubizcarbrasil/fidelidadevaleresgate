import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useFotoPerfilMotorista } from "../../hooks/useFotoPerfilMotorista";
import { useDriverSession } from "@/contexts/DriverSessionContext";

interface Props {
  onFotoCadastrada: () => void;
  fontHeading?: string;
  driverId?: string | null;
}

export default function BloqueioInscricaoSemFoto({
  onFotoCadastrada,
  fontHeading,
  driverId,
}: Props) {
  const { customerId } = useFotoPerfilMotorista(driverId);
  // brand_id é necessário pra validação cross-tenant na edge function
  const { driver } = useDriverSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArquivo(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErro(null);
  }

  function abrirSeletor() {
    inputRef.current?.click();
  }

  async function confirmarUpload() {
    if (!arquivo || !customerId) return;
    setUploading(true);
    setErro(null);

    try {
      const brandId = driver?.brand_id;
      if (!brandId) {
        setErro("Sessão inválida. Faça login novamente.");
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("driver_id", customerId);
      formData.append("brand_id", brandId); // Validação cross-tenant
      formData.append("file", arquivo);

      const { data, error } = await supabase.functions.invoke(
        "driver-upload-photo",
        { body: formData },
      );

      if (error || (data as any)?.error) {
        const code = (data as any)?.error ?? "";
        const msg = (data as any)?.message ?? "";
        if (code === "bucket_missing") {
          setErro("O armazenamento de fotos ainda não foi configurado. Avise o suporte do app.");
        } else if (code === "invalid_file") {
          setErro(msg || "Arquivo inválido.");
        } else if (code === "driver_not_found" || code === "not_a_driver") {
          setErro("Sua sessão expirou. Faça login novamente.");
        } else {
          setErro("Não foi possível enviar a foto. Tente novamente.");
        }
        return;
      }

      toast.success("Foto cadastrada!");
      onFotoCadastrada();
    } catch (err) {
      setErro("Erro inesperado ao enviar a foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center min-h-[60vh]">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Camera className="h-12 w-12 text-primary" />
      </div>

      <h2
        className="text-xl font-bold mb-2"
        style={{ fontFamily: fontHeading }}
      >
        Foto obrigatória
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Para participar do Campeonato você precisa ter uma foto de perfil.
        Sua foto aparecerá nos duelos para todos os participantes verem.
      </p>

      {previewUrl && (
        <div className="mb-6">
          <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-primary/20 mx-auto">
            <img
              src={previewUrl}
              alt="Pré-visualização da foto"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {erro && (
        <div className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive max-w-sm">
          {erro}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleSelecionarArquivo}
      />

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {!previewUrl ? (
          <Button onClick={abrirSeletor} size="lg" className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Adicionar minha foto
          </Button>
        ) : (
          <>
            <Button
              onClick={confirmarUpload}
              size="lg"
              className="w-full"
              disabled={uploading || !customerId}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Confirmar foto"
              )}
            </Button>
            <Button
              onClick={abrirSeletor}
              variant="outline"
              size="sm"
              disabled={uploading}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Trocar foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}