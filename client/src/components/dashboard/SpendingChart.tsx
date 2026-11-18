import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type XAxisTickContentProps,
} from 'recharts';
import { formatMoney, formatMoneyRounded, formatMonthShort, formatMonthYear } from '@/lib/format';
import type { ChartPoint, Currency } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface SpendingChartProps {
  data: ChartPoint[];
  currency: Currency;
}

const kindLabels: Record<ChartPoint['kind'], string> = {
  actual: 'Фактично',
  current: 'Поточний місяць',
  forecast: 'Прогноз',
};

const barClass: Record<ChartPoint['kind'], string> = {
  actual: ui.chart.barActual,
  current: ui.chart.barCurrent,
  forecast: ui.chart.barForecast,
};

interface TooltipPayload {
  payload?: ChartPoint;
}

function ChartTooltip({ active, payload, currency }: { active?: boolean; payload?: TooltipPayload[]; currency: Currency }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className={ui.chart.tooltip}>
      <div className={ui.chart.tooltipLabel}>
        {formatMonthYear(point.month)} · {kindLabels[point.kind]}
      </div>
      <div className="font-semibold">{formatMoney(point.amount, currency)}</div>
    </div>
  );
}

/** Витрати за місяцями: минулі (фактично), поточний, майбутні (прогноз, пунктир). Кольори — з токенів теми. */
export function SpendingChart({ data, currency }: SpendingChartProps) {
  const current = data.find((d) => d.kind === 'current')?.month;

  return (
    <div className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <h2 className={ui.layout.cardTitle}>Витрати за місяцями</h2>
        <ul className={ui.legend.list} aria-label="Легенда">
          <li className={ui.legend.item}>
            <span className={ui.legend.actual} aria-hidden="true" />
            Фактично
          </li>
          <li className={ui.legend.item}>
            <span className={ui.legend.current} aria-hidden="true" />
            Поточний
          </li>
          <li className={ui.legend.item}>
            <span className={ui.legend.forecast} aria-hidden="true" />
            Прогноз
          </li>
        </ul>
      </div>
      <div className={ui.chart.box} role="img" aria-label={chartSummary(data, currency)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} className={ui.chart.grid} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatMonthShort}
              tick={({ x, y, payload }: XAxisTickContentProps) => {
                const month = String(payload.value);
                return (
                  <text
                    x={Number(x)}
                    y={Number(y) + 12}
                    textAnchor="middle"
                    className={month === current ? ui.chart.tickCurrent : ui.chart.tick}
                  >
                    {formatMonthShort(month)}
                  </text>
                );
              }}
            />
            <YAxis
              width={64}
              tickLine={false}
              axisLine={false}
              tick={{ className: ui.chart.tick }}
              tickFormatter={(v: number) => formatMoneyRounded(v, currency)}
            />
            <Tooltip cursor={{ className: ui.chart.cursor }} content={<ChartTooltip currency={currency} />} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.month} className={barClass[d.kind]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Текстовий опис графіка для скрінрідера. */
function chartSummary(data: ChartPoint[], currency: Currency): string {
  return (
    'Графік витрат: ' +
    data.map((d) => `${formatMonthYear(d.month)} — ${formatMoneyRounded(d.amount, currency)} (${kindLabels[d.kind]})`).join('; ')
  );
}
