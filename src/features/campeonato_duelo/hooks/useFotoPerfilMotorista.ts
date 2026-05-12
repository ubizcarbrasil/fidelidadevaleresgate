import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FotoPerfilResultado {
  customerId: string | null;
  photoUrl: string | null;
}

/**
 * Lê a foto de perfil do motorista logado.
 * Prioridade: customers.photo_url -> driver_profiles.photo_url.
 * Apenas leitura.
 */
export function useFotoPerfilMotorista() {
  const query = useQuery({
    queryKey: ["foto-perfil-motorista"],
    queryFn: async (): Promise<FotoPerfilResultado> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { customerId: null, photoUrl: null };

      const { data: customer } = await supabase
        .from("customers")
        .select("id, photo_url")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; photo_url: string | null }>();

      if (!customer) return { customerId: null, photoUrl: null };

      if (customer.photo_url) {
        return { customerId: customer.id, photoUrl: customer.photo_url };
      }

      const { data: profile } = await (supabase as any)
        .from("driver_profiles")
        .select("photo_url")
        .eq("customer_id", customer.id)
        .maybeSingle();

      return {
        customerId: customer.id,
        photoUrl: (profile?.photo_url as string | null) ?? null,
      };
    },
  });

  const data = query.data ?? { customerId: null, photoUrl: null };

  return {
    customerId: data.customerId,
    photoUrl: data.photoUrl,
    temFoto: !!data.photoUrl,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useFotoPerfilMotorista;