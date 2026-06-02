// Sparkline isolado em módulo separado pra permitir lazy-load.
// Antes, KpiCard importava recharts statically → toda KpiCard puxava
// CartesianChart (270KB raw / 85KB gzip) no boot do Dashboard.
// Agora, recharts só baixa após o KpiCard montar e renderizar o sparkline.

import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface KpiSparklineProps {
  data: number[];
  stroke: string;
  gradientId: string;
}

export default function KpiSparkline({ data, stroke, gradientId }: KpiSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={48} minWidth={0} minHeight={0}>
      <AreaChart data={data.map((v, i) => ({ v, i }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
            <stop offset="95%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} fill={`url(#${gradientId})`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
