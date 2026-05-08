import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { buscarBrandIdPorHostname, buscarMarcaPorId } from "../services/servico_ofertas_publicas";
import type { MarcaOfertas } from "../types/tipos_ofertas";

const PORTAL_HOSTNAME = "app.valeresgate.com.br";
const PORTAL_BRAND_ID = "db15bd21-9137-4965-a0fb-540d8e8b26f1";

/**
 * Resolve a marca para a vitrine pública /ofertas.
 * Prioridade: ?brandId= URL > BrandContext > brand_domains (hostname) > portal Ubiz Resgata.
 */
export function useMarcaOfertas() {
  const [searchParams] = useSearchParams();
  const { brand: ctxBrand, loading: ctxLoading } = useBrand();
  const brandIdParam = searchParams.get("brandId");

  // Resolve hostname imediatamente para evitar esperar o BrandContext
  // (acelera muito a abertura em in-app browsers / webviews).
  const hostnameInicial = typeof window !== "undefined" ? window.location.hostname : "";
  const brandIdInicial = brandIdParam
    ? brandIdParam
    : hostnameInicial === PORTAL_HOSTNAME
    ? PORTAL_BRAND_ID
    : null;

  const [brandId, setBrandId] = useState<string | null>(brandIdInicial);
  const [marca, setMarca] = useState<MarcaOfertas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    if (brandIdParam) {
      setBrandId(brandIdParam);
      return;
    }
    if (brandId) return;
    if (ctxLoading) return;
    if (ctxBrand?.id) {
      setBrandId(ctxBrand.id);
      return;
    }
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    if (hostname === PORTAL_HOSTNAME) {
      setBrandId(PORTAL_BRAND_ID);
      return;
    }
    buscarBrandIdPorHostname(hostname).then((id) => {
      if (!ativo) return;
      if (id) setBrandId(id);
      else {
        setErro("Não foi possível identificar a marca para esta vitrine.");
        setCarregando(false);
      }
    });
    return () => {
      ativo = false;
    };
  }, [brandIdParam, ctxBrand?.id, ctxLoading]);

  useEffect(() => {
    let ativo = true;
    if (!brandId) return;
    setErro(null);
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