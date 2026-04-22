import { MapPin, MessageCircle, ChevronRight, Ticket, Coins, Trophy } from "lucide-react";

interface Props {
  fontHeading?: string;
  showCityRedeem: boolean;
  showCityRedemptions?: boolean;
  showBuyPoints?: boolean;
  showCampeonato?: boolean;
  whatsappNumber?: string;
  onCityRedeem: () => void;
  onCityRedemptions: () => void;
  onBuyPoints?: () => void;
  onCampeonato?: () => void;
  achadinhosEnabled?: boolean;
}

export default function QuickActionCards({ fontHeading, showCityRedeem, showCityRedemptions = false, showBuyPoints = false, showCampeonato = false, whatsappNumber, onCityRedeem, onCityRedemptions, onBuyPoints, onCampeonato, achadinhosEnabled = false }: Props) {
  return (
    <div className="px-4 space-y-3">
      {showCampeonato && (
        <button
          onClick={onCampeonato}
          className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <Trophy className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              Campeonato
            </p>
            <p className="text-[11px] text-muted-foreground">
              Veja sua posição, confronto e histórico
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {showCityRedeem && (
        <button
          onClick={onCityRedeem}
          className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <MapPin className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              Resgate na Cidade
            </p>
            <p className="text-[11px] text-muted-foreground">
              Use seus pontos em lojas parceiras
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {showCityRedemptions && (
        <button
          onClick={onCityRedemptions}
          className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#f59e0b20" }}
          >
            <Ticket className="h-5 w-5" style={{ color: "#f59e0b" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              Meus Resgates
            </p>
            <p className="text-[11px] text-muted-foreground">
              Acompanhe seus resgates na cidade
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {showBuyPoints && (
        <button
          onClick={onBuyPoints}
          className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <Coins className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              Comprar Pontos
            </p>
            <p className="text-[11px] text-muted-foreground">
              Adquira pontos para resgatar ofertas
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {achadinhosEnabled && whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de enviar um link de produto do Mercado Livre para gerar pontos.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left block"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#25D36620" }}
          >
            <MessageCircle className="h-5 w-5" style={{ color: "#25D366" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              Ganhe pontos comprando no ML
            </p>
            <p className="text-[11px] text-muted-foreground">
              Envie o link do produto via WhatsApp e receba o link de pontuação
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </a>
      )}
    </div>
  );
}
