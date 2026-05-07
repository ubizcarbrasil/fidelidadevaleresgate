import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buscarMarcaPorId } from "../services/servico_ofertas_publicas";
import type { MarcaOfertas } from "../types/tipos_ofertas";

const PORTAL_HOSTNAME = "app.valeresgate.com.br";
const PORTAL_BRAND_ID = "db15bd21-9137-4965-a0fb-540d8e8b26f1";

/**
 * Resolve a marca para a vitrine pública /ofertas.
 * Prioridade: ?brandId= URL > hostname do portal Ubiz Resgata.
 */
export function useMarcaOfertas() {
  const [searchParams] = useSearchParams();
  const isPortalDomain = typeof window !== "undefined" && window.location.hostname === PORTAL_HOSTNAME;
  const brandId = searchParams.get("brandId") || (isPortalDomain ? PORTAL_BRAND_ID : null);

  const [marca, setMarca] = useState<MarcaOfertas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    if (!brandId) {
      setErro("Parâmetro brandId é obrigatório");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    buscarMarcaPorId(brandId)
      .then((b) => {
        if (!ativo) return;
        if (!b) setErro("Marca não encontrada");
        else setMarca(b);
        setCarregando(false);
      })
      .catch((e) => {
        if (!ativo) return;
        setErro(e?.message || "Erro ao carregar marca");
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [brandId]);

  return { brandId, marca, carregando, erro };
}