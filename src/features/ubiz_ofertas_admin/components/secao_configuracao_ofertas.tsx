import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react";
import LinkPublicoOfertas from "@/features/ubiz_ofertas/components/link_publico_ofertas";
import ControleAcessoOfertas, {
  type ModoAcessoOfertas,
} from "@/features/ubiz_ofertas/components/controle_acesso_ofertas";

interface Props {
  brandId?: string;
  brandName?: string;
  habilitado: boolean;
  titulo: string;
  modoAcesso: ModoAcessoOfertas;
  whitelist: string[];
  onChange: (parcial: {
    enable_ubiz_ofertas_mode?: boolean;
    ubiz_ofertas_title?: string;
    ubiz_ofertas_access_mode?: ModoAcessoOfertas;
    ubiz_ofertas_whitelist?: string[];
  }) => void;
}

export default function SecaoConfiguracaoOfertas({
  brandId,
  brandName,
  habilitado,
  titulo,
  modoAcesso,
  whitelist,
  onChange,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" /> Vitrine pública Ubiz Ofertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Ativar vitrine pública</Label>
            <p className="text-[11px] text-muted-foreground">
              Ativa a rota pública <code>/ofertas</code> com a mesma vitrine dos Achadinhos,
              porém sem pontuação, duelos, campeonato, apostas, comprar pontos ou WhatsApp.
            </p>
          </div>
          <Switch
            checked={habilitado}
            onCheckedChange={(checked) =>
              onChange({ enable_ubiz_ofertas_mode: checked === true })
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Título exibido na vitrine</Label>
          <Input
            value={titulo}
            onChange={(e) => onChange({ ubiz_ofertas_title: e.target.value })}
            placeholder="Ubiz Ofertas"
          />
        </div>

        {habilitado && (
          <>
            <ControleAcessoOfertas
              modo={modoAcesso}
              whitelist={whitelist}
              onModoChange={(modo) => onChange({ ubiz_ofertas_access_mode: modo })}
              onWhitelistChange={(lista) => onChange({ ubiz_ofertas_whitelist: lista })}
            />
            <LinkPublicoOfertas brandId={brandId} titulo={titulo || brandName} />
          </>
        )}
      </CardContent>
    </Card>
  );
}