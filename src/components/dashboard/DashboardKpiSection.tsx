import { Car, Coins, MapPin, Package, ReceiptText, ShoppingBag, Store, Tag, UserCheck } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";

interface DashboardKpiSectionProps {
  // Main KPIs
  redemptionsPeriod?: number;
  redemptionsTotal?: number;
  customersTotal?: number;
  customersActive?: number;
  earningEventsPeriod?: number;
  earningEventsTotal?: number;
  offersActive?: number;
  offersTotal?: number;
  // Motoristas
  motoristasTotal?: number;
  pontosMotoristas?: number;
  pontosClientes?: number;
  // Achadinhos
  achadinhosAtivas?: number;
  achadinhosLojas?: number;
  achadinhosCidades?: number;
  // Resgates de Produtos
  productRedemptionsPending?: number;
  productRedemptionsMonth?: number;
  // Spark data
  recentRedemptions?: number[];
  recentEarnings?: number[];
  // Scoring model flags
  isDriverEnabled?: boolean;
  isPassengerEnabled?: boolean;
}

export default function DashboardKpiSection({
  redemptionsPeriod, redemptionsTotal, customersTotal, customersActive,
  earningEventsPeriod, earningEventsTotal, offersActive, offersTotal,
  motoristasTotal, pontosMotoristas, pontosClientes,
  achadinhosAtivas, achadinhosLojas, achadinhosCidades,
  productRedemptionsPending, productRedemptionsMonth,
  recentRedemptions, recentEarnings,
  isDriverEnabled = true, isPassengerEnabled = true,
}: DashboardKpiSectionProps) {
  return (
    <>
      {/* KPIs Principais — PASSENGER */}
      {isPassengerEnabled && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-up delay-1">
            <KpiCard title="Resgates" value={redemptionsPeriod} sub={`${redemptionsTotal ?? 0} total`} icon={ReceiptText} color="primary" sparkData={recentRedemptions} />
          </div>
          <div className="animate-slide-up delay-2">
            <KpiCard title="Clientes" value={customersTotal} sub={`${customersActive ?? 0} ativos`} icon={UserCheck} color="success" sparkData={recentEarnings} />
          </div>
          <div className="animate-slide-up delay-3">
            <KpiCard title="Pontuações" value={earningEventsPeriod} sub={`${earningEventsTotal ?? 0} total`} icon={Coins} color="primary" sparkData={recentEarnings} />
          </div>
          <div className="animate-slide-up delay-4">
            <KpiCard title="Ofertas Ativas" value={offersActive} sub={`${offersTotal ?? 0} total`} icon={Tag} color="violet" sparkData={recentRedemptions} />
          </div>
        </div>
      )}

      {/* KPIs Motoristas/Clientes — mixed */}
      {(isDriverEnabled || isPassengerEnabled) && (
        <div className={`grid gap-3 sm:gap-4 grid-cols-1 ${
          isDriverEnabled && isPassengerEnabled ? "sm:grid-cols-3" :
          "sm:grid-cols-2"
        }`}>
          {isDriverEnabled && (
            <div className="animate-slide-up delay-1">
              <KpiCard title="Motoristas" value={motoristasTotal} icon={Car} color="warning" />
            </div>
          )}
          {isDriverEnabled && (
            <div className="animate-slide-up delay-2">
              <KpiCard title="Pontos Motoristas" value={pontosMotoristas !== undefined ? pontosMotoristas.toLocaleString("pt-BR") : undefined} icon={Coins} color="success" />
            </div>
          )}
          {isPassengerEnabled && isDriverEnabled && (
            <div className="animate-slide-up delay-3">
              <KpiCard title="Pontos Clientes" value={pontosClientes !== undefined ? pontosClientes.toLocaleString("pt-BR") : undefined} icon={UserCheck} color="primary" />
            </div>
          )}
        </div>
      )}

      {/* KPIs Resgates de Produtos */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="animate-slide-up delay-1">
          <KpiCard
            title="Resgates Produtos (Pendentes)"
            value={productRedemptionsPending}
            sub={`${productRedemptionsMonth ?? 0} este mês`}
            icon={Package}
            color={productRedemptionsPending && productRedemptionsPending > 0 ? "destructive" : "warning"}
          />
        </div>
        <div className="animate-slide-up delay-2">
          <KpiCard
            title="Resgates Produtos (Mês)"
            value={productRedemptionsMonth}
            icon={Package}
            color="primary"
          />
        </div>
      </div>

      {/* KPIs Achadinhos — sempre visíveis */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="animate-slide-up delay-1">
            <KpiCard title="Achadinhos Ativos" value={achadinhosAtivas} icon={ShoppingBag} color="warning" />
          </div>
          <div className="animate-slide-up delay-2">
            <KpiCard title="Lojas Ativas" value={achadinhosLojas} icon={Store} color="success" />
          </div>
          <div className="animate-slide-up delay-3">
            <KpiCard title="Cidades Ativas" value={achadinhosCidades} icon={MapPin} color="primary" />
          </div>
        </div>
    </>
  );
}
