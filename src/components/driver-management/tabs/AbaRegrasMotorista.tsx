import DriverRuleEditor from "../DriverRuleEditor";

interface Props {
  driverId: string;
  brandId: string;
}

export default function AbaRegrasMotorista({ driverId, brandId }: Props) {
  return <DriverRuleEditor driverId={driverId} brandId={brandId} />;
}
