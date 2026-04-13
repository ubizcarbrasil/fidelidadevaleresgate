import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Globe, Instagram } from "lucide-react";

interface InfoContatoLojaProps {
  endereco: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  siteUrl: string | null;
}

export default function InfoContatoLoja({ endereco, telefone, whatsapp, instagram, siteUrl }: InfoContatoLojaProps) {
  const temContato = endereco || telefone || whatsapp || instagram || siteUrl;
  if (!temContato) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Contato & Localização</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {endereco && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{endereco}</span>
          </div>
        )}
        {telefone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{telefone}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {whatsapp && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Phone className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </Button>
          )}
          {instagram && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-3.5 w-3.5" /> Instagram
              </a>
            </Button>
          )}
          {siteUrl && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`} target="_blank" rel="noopener noreferrer">
                <Globe className="h-3.5 w-3.5" /> Site
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
