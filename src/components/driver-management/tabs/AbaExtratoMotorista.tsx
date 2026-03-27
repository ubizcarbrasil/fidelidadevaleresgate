import DriverLedgerSection from "../DriverLedgerSection";

interface Props {
  driverId: string;
  driverName: string;
}

export default function AbaExtratoMotorista({ driverId, driverName }: Props) {
  return <DriverLedgerSection driverId={driverId} driverName={driverName} />;
}
