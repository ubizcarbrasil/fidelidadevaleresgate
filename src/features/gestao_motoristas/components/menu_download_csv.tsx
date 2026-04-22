import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Copy,
  Mail,
  QrCode,
  Share2,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { ehIOS } from "../utils/utilitarios_export_motoristas";

interface MenuDownloadCsvProps {
  aberto: boolean;
  onFechar: () => void;
  url: string;
  nomeArquivo: string;
  totalMotoristas: number;
  excedeuLimite: boolean;
  onSucesso?: () => void;
}

type Tela = "menu" | "qr";

/**
 * Modal com 5 alternativas para baixar o CSV — pensado para iPhone/PWA
 * onde `navigator.share` e `window.open` falham silenciosamente.
 * Todas as opções consomem a mesma URL HTTPS assinada gerada na exportação.
 */
export default function MenuDownloadCsv({
  aberto,
  onFechar,
  url,
  nomeArquivo,
  totalMotoristas,
  excedeuLimite,
  onSucesso,
}: MenuDownloadCsvProps) {
  const [tela, setTela] = useState<Tela>("menu");
  const isIos = ehIOS();

  const fechar = () => {
    setTela("menu");
    onFechar();
  };

  const concluir = () => {
    onSucesso?.();
    fechar();
  };

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado! Cole no Safari, e-mail ou WhatsApp.");
    } catch {
      toast.error("Não foi possível copiar. Selecione manualmente o link.");
    }
  };

  const handleCompartilharNativo = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      toast.error("Compartilhamento nativo indisponível neste dispositivo.");
      return;
    }
    try {
      await navigator.share({
        title: "Motoristas (CSV)",
        text: `Exportação de ${totalMotoristas.toLocaleString("pt-BR")} motoristas`,
        url,
      });
      concluir();
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      toast.error("Falha no compartilhamento. Use uma das outras opções.");
    }
  };

  const corpoEmail = encodeURIComponent(
    `Segue o link para baixar o CSV de motoristas (${totalMotoristas.toLocaleString(
      "pt-BR",
    )} registros). Link válido por 30 minutos:\n\n${url}`,
  );
  const assuntoEmail = encodeURIComponent(`Exportação de motoristas — ${nomeArquivo}`);

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tela === "qr" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 -ml-2"
                onClick={() => setTela("menu")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {tela === "menu" ? "Como você quer baixar?" : "Escaneie o QR Code"}
          </DialogTitle>
          <DialogDescription>
            {tela === "menu" ? (
              <>
                {excedeuLimite ? (
                  <span className="text-amber-500">
                    Limite de 20.000 atingido —{" "}
                  </span>
                ) : null}
                {totalMotoristas.toLocaleString("pt-BR")} motoristas prontos para download.
              </>
            ) : (
              "Use a câmera de outro celular ou o leitor de QR para abrir o link."
            )}
          </DialogDescription>
        </DialogHeader>

        {tela === "menu" ? (
          <div className="space-y-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={nomeArquivo}
              onClick={() => setTimeout(concluir, 300)}
              className="flex items-center gap-3 w-full rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 p-3 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Abrir no Safari
                  {isIos && (
                    <span className="ml-2 text-xs text-primary">(recomendado)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Abre o navegador real e oferece "Salvar em Arquivos".
                </p>
              </div>
            </a>

            <button
              type="button"
              onClick={handleCopiarLink}
              className="flex items-center gap-3 w-full rounded-lg border border-border bg-card hover:bg-accent p-3 transition-colors"
            >
              <Copy className="h-5 w-5 text-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Copiar link de download
                </p>
                <p className="text-xs text-muted-foreground">
                  Cole no Safari, e-mail, WhatsApp ou outro dispositivo.
                </p>
              </div>
            </button>

            <a
              href={`mailto:?subject=${assuntoEmail}&body=${corpoEmail}`}
              onClick={() => setTimeout(concluir, 300)}
              className="flex items-center gap-3 w-full rounded-lg border border-border bg-card hover:bg-accent p-3 transition-colors"
            >
              <Mail className="h-5 w-5 text-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Enviar por e-mail</p>
                <p className="text-xs text-muted-foreground">
                  Abre o app de Mail com o link já preenchido.
                </p>
              </div>
            </a>

            <button
              type="button"
              onClick={() => setTela("qr")}
              className="flex items-center gap-3 w-full rounded-lg border border-border bg-card hover:bg-accent p-3 transition-colors"
            >
              <QrCode className="h-5 w-5 text-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Mostrar QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Escaneie com outro celular ou desktop e baixe lá.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleCompartilharNativo}
              className="flex items-center gap-3 w-full rounded-lg border border-dashed border-border bg-transparent hover:bg-accent p-3 transition-colors"
            >
              <Share2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Compartilhar nativo
                </p>
                <p className="text-xs text-muted-foreground">
                  Pode falhar em alguns iPhones — use as opções acima se travar.
                </p>
              </div>
            </button>

            <p className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Link seguro, válido por 30 minutos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-lg bg-white p-4">
              <QRCodeSVG value={url} size={220} level="M" includeMargin={false} />
            </div>
            <p className="text-xs text-center text-muted-foreground max-w-xs">
              Aponte a câmera para o código. O link expira em 30 minutos.
            </p>
            <Button variant="outline" size="sm" onClick={handleCopiarLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copiar link em vez do QR
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}