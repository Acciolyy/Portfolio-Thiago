import type { GaugeData } from "@/content/tipos";
import Gauge from "@/components/interactive/Gauge";

export default function GaugeGroup({ gauges }: { gauges: readonly GaugeData[] }) {
  return (
    <div className="gauge-group">
      {gauges.map((g) => (
        <Gauge key={g.titulo + g.valor} {...g} />
      ))}
    </div>
  );
}
