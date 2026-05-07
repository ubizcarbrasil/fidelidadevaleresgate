import { useEffect, useState } from "react";
import { getPublicOrigin } from "@/lib/publicShareUrl";

/**
 * Retorna o origin atual quando o usuário está acessando por um domínio
 * "real" (custom domain ou published), ignorando previews do Lovable.
 */
function obterOriginAtualSeProducao(): string | null {
  if (typeof window === "undefined") return null;
  const { hostname, origin } = window.location;
  if (!hostname) return null;
  // Ignora previews/sandbox do editor Lovable
  if (hostname.includes("preview--") || hostname.endsWith(".lovableproject.com")) {
    return null;
  }
  // localhost também não serve para link público
  if (hostname === "localhost" || hostname.startsWith("127.")) return null;
  return origin;
}

/**
 * Resolve a URL pública /ofertas para a marca informada.
 * Prioridade:
 *   1. Origin atual da janela (se for custom domain ou published, não preview)
 *   2. Resolução central: driver_public_base_url > brand_domains > publicado
 */
export function useLinkPublicoOfertas(brandId?: string) {
  const [url, setUrl] = useState<string>("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;
    if (!brandId) {
      setUrl("");
      return;
    }
    // 1) Se já estamos em um domínio público real, usa ele direto.
    const originAtual = obterOriginAtualSeProducao();
    if (originAtual) {
      setUrl(`${originAtual}/ofertas`);
      setCarregando(false);
      return;
    }
    // 2) Caso contrário (preview/localhost), resolve pelo backend.
    setCarregando(true);
    getPublicOrigin(brandId)
      .then((origin) => {
        if (!ativo) return;
        setUrl(`${origin}/ofertas`);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [brandId]);

  return { url, carregando };
}