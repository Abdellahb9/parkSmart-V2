import { ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, EmptyState, Skeleton } from '../../components/ui';
import { useDirection } from '../../i18n';

/**
 * Chart chrome shared by both dashboards: title, fixed height, and — the part
 * the old charts were missing — an explicit empty state instead of an axis
 * frame with nothing in it.
 */
export function ChartCard({ title, description, loading, isEmpty, emptyLabel, height = 260, children }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {loading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : isEmpty ? (
          <div style={{ height }} className="grid place-items-center">
            <EmptyState title={emptyLabel ?? t('ui.chartEmpty')} description={t('ui.chartEmptyHint')} />
          </div>
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/** Tooltip styled from tokens, so it matches the cards in both themes. */
export function ChartTooltip({ formatter, labelFormatter }) {
  return (
    <Tooltip
      cursor={{ fill: 'var(--color-surface-alt)', stroke: 'var(--color-border)' }}
      contentStyle={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        color: 'var(--color-text)',
        fontSize: 13,
        boxShadow: 'var(--shadow-2)',
      }}
      labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}
      itemStyle={{ color: 'var(--color-text)' }}
      formatter={formatter}
      labelFormatter={labelFormatter}
    />
  );
}

export const AXIS = {
  stroke: 'var(--color-text-muted)',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

export const GRID_STROKE = 'var(--color-border)';

/**
 * Axis props that follow the reading direction. Recharts does not mirror on
 * its own: in Arabic, time has to run right to left and the value axis sits
 * on the right, or every chart reads backwards.
 */
export function useChartAxes() {
  const { rtl } = useDirection();
  return {
    x: { ...AXIS, reversed: rtl },
    y: { ...AXIS, orientation: rtl ? 'right' : 'left' },
    // Mirror the chart margins so the negative inset stays on the axis side.
    margin: (m) => (rtl ? { ...m, left: m.right, right: m.left } : m),
  };
}
