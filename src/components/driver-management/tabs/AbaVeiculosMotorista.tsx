import { Car, Calendar, Palette, MapPin, FileText, Hash, Loader2 } from "lucide-react";
import { useDriverProfile } from "../hooks/hook_perfil_motorista";
import {
  formatarTexto,
  formatarNumero,
  formatarBooleano,
  formatarPlaca,
} from "../utils/formatadores_motorista";
import CardFichaMotorista from "./componentes/CardFichaMotorista";
import LinhaInfo from "./componentes/LinhaInfo";

interface Props {
  driverId: string;
}

interface VeiculoProps {
  titulo: string;
  model: string | null;
  year: number | null;
  color: string | null;
  plate: string | null;
  state: string | null;
  city: string | null;
  renavam: string | null;
  own: boolean | null;
  exerciseYear: number | null;
}

function CardVeiculo({
  titulo,
  model,
  year,
  color,
  plate,
  state,
  city,
  renavam,
  own,
  exerciseYear,
}: VeiculoProps) {
  return (
    <CardFichaMotorista titulo={titulo}>
      <LinhaInfo icon={Car} label="Modelo" value={formatarTexto(model)} />
      <LinhaInfo icon={Calendar} label="Ano" value={formatarNumero(year)} />
      <LinhaInfo icon={Palette} label="Cor" value={formatarTexto(color)} />
      <LinhaInfo icon={Hash} label="Placa" value={formatarPlaca(plate)} />
      <LinhaInfo icon={MapPin} label="UF" value={formatarTexto(state)} />
      <LinhaInfo icon={MapPin} label="Cidade" value={formatarTexto(city)} />
      <LinhaInfo icon={FileText} label="RENAVAM" value={formatarTexto(renavam)} />
      <LinhaInfo icon={Car} label="Próprio?" value={formatarBooleano(own)} />
      <LinhaInfo
        icon={Calendar}
        label="Exercício"
        value={formatarNumero(exerciseYear)}
        labelWidth="w-24"
      />
    </CardFichaMotorista>
  );
}

export default function AbaVeiculosMotorista({ driverId }: Props) {
  const { data: perfil, isLoading } = useDriverProfile(driverId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando veículos...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <Car className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhum veículo cadastrado.
          <br />
          <span className="text-xs">Importe a planilha do TaxiMachine para popular estes dados.</span>
        </p>
      </div>
    );
  }

  const temVeiculo2 =
    perfil.vehicle2_model || perfil.vehicle2_plate || perfil.vehicle2_renavam;

  return (
    <div className="space-y-4">
      <CardVeiculo
        titulo="Veículo Principal"
        model={perfil.vehicle1_model}
        year={perfil.vehicle1_year}
        color={perfil.vehicle1_color}
        plate={perfil.vehicle1_plate}
        state={perfil.vehicle1_state}
        city={perfil.vehicle1_city}
        renavam={perfil.vehicle1_renavam}
        own={perfil.vehicle1_own}
        exerciseYear={perfil.vehicle1_exercise_year}
      />

      {temVeiculo2 && (
        <CardVeiculo
          titulo="Veículo Secundário"
          model={perfil.vehicle2_model}
          year={perfil.vehicle2_year}
          color={perfil.vehicle2_color}
          plate={perfil.vehicle2_plate}
          state={perfil.vehicle2_state}
          city={perfil.vehicle2_city}
          renavam={perfil.vehicle2_renavam}
          own={perfil.vehicle2_own}
          exerciseYear={perfil.vehicle2_exercise_year}
        />
      )}
    </div>
  );
}
