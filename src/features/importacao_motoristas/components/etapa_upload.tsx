import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { parsearArquivo } from "../utils/parser_planilha";
import type { LinhaPlanilha } from "../types/tipos_importacao";

const ehIos = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && "ontouchend" in document);
};

interface Props {
  onLoaded: (linhas: LinhaPlanilha[]) => void;
}

export default function EtapaUpload({ onLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Não cancela usuário: se cancelou o picker, não acontece nada.
    if (!file) {
      // Reset apenas para permitir re-seleção do mesmo arquivo depois.
      e.target.value = "";
      return;
    }

    const ok = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!ok) {
      toast.error("Selecione um arquivo .csv, .xlsx ou .xls");
      e.target.value = "";
      return;
    }

    if (file.size === 0) {
      toast.error("Arquivo vazio. No iPhone, escolha em Arquivos → iCloud Drive ou No meu iPhone.");
      e.target.value = "";
      return;
    }

    try {
      const linhas = await parsearArquivo(file);
      if (linhas.length === 0) {
        toast.error("Arquivo vazio ou sem cabeçalhos.");
        e.target.value = "";
        return;
      }
      if (linhas.length > 5000) {
        toast.error("Limite de 5.000 linhas por importação. Divida o arquivo.");
        e.target.value = "";
        return;
      }
      onLoaded(linhas);
    } catch (err) {
      toast.error("Erro ao ler arquivo: " + (err instanceof Error ? err.message : ""));
    } finally {
      // Reset DEPOIS de tratar — permite re-selecionar o mesmo arquivo numa segunda tentativa.
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <FileSpreadsheet className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Selecione a planilha de motoristas</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aceita <strong>.csv</strong>, <strong>.xlsx</strong> ou <strong>.xls</strong>. Até 5.000 linhas por importação.
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />
      <Button onClick={() => fileRef.current?.click()} size="lg">
        <Upload className="h-4 w-4 mr-2" />
        Escolher arquivo
      </Button>
      <p className="text-xs text-muted-foreground max-w-sm">
        Cabeçalhos da TaxiMachine são reconhecidos automaticamente. Campos vazios na planilha não sobrescrevem dados existentes.
      </p>
      {ehIos() && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-left max-w-sm">
          <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong>No iPhone:</strong> toque em <strong>Escolher arquivo</strong> e selecione o CSV em
            <strong> Arquivos → iCloud Drive</strong> ou <strong>No meu iPhone</strong>. Evite copiar do
            WhatsApp/Email diretamente — salve antes em Arquivos.
          </p>
        </div>
      )}
    </div>
  );
}
