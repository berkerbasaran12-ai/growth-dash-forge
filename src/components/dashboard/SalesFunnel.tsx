import { useMemo } from "react";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface SalesFunnelProps {
  steps: FunnelStep[];
}

export function SalesFunnel({ steps }: SalesFunnelProps) {
  const maxValue = useMemo(() => Math.max(...steps.map(s => s.value), 1), [steps]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground mb-3">📊 Satış Hunisi</h3>
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const widthPercent = Math.max((step.value / maxValue) * 100, 12);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 flex justify-center">
                <div
                  className="relative h-9 rounded-md flex items-center justify-center transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: step.color,
                    minWidth: "80px",
                  }}
                >
                  <span className="text-white text-xs font-bold drop-shadow-sm">
                    {step.value.toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground w-24 text-left shrink-0">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {steps.length >= 2 && steps[0].value > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Genel Dönüşüm: <span className="font-semibold text-foreground">
            %{((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(1)}
          </span>
        </p>
      )}
    </div>
  );
}
