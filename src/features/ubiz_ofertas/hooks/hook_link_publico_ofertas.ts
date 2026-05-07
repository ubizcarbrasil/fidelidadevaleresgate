import { useEffect, useState } from "react";
import { getPublicOrigin } from "@/lib/publicShareUrl";

/**
 * Resolve a URL pública /ofertas para a marca informada.
 * Reutiliza a resolução de domínio já existente (driver_public_base_url > brand_domains > publicado).
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