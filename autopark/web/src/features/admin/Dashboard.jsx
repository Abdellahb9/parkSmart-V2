import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, CalendarCheck, Coins, SquareParking, TicketCheck, TrendingDown } from 'lucide-react';
import { AsyncState, Badge, Button, Card, CardBody, CardHeader, StatCard } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { ChartCard, ChartTooltip, GRID_STROKE, useChartAxes } from '../common/ChartCard';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services';
import { dayName, fmtMAD, fmtNumber, hourLabel, trendPct } from '../../lib/format';

const RANGES = [
  { id: '7d', days: 7 },
  { id: '30d', days: 30 },
  { id: '90d', days: 90 },
  { id: '365d', days: 365 },
];

const rangeParams = (days) => {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const axes = useChartAxes();
  const [rangeId, setRangeId] = useState('30d');
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[1];
  const rangeLabel = t(`dashboard.ranges.${range.id}`);

  const { data, loading, error, reload } = useAsync(
    () => adminService.stats(rangeParams(range.days)),
    [range.days]
  );

  const revenueSeries = useMemo(
    () =>
      (data?.revenuePerMonth ?? []).map((r) => ({
        label: `${String(r._id.month).padStart(2, '0')}/${r._id.year}`,
        revenue: r.revenue,
        count: r.count,
      })),
    [data]
  );

  // The language is a dependency: weekday and hour labels are translated.
  const daySeries = useMemo(
    () => (data?.reservationsByDay ?? []).map((d) => ({ label: dayName(d._id), count: d.count })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language]
  );

  const hourSeries = useMemo(
    () => (data?.peakHours ?? []).map((h) => ({ label: hourLabel(h._id), count: h.count })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language]
  );

  const bookingsText = (n) => t('common.reservations', { count: n, n: fmtNumber(n) });

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <div
            role="group"
            aria-label={t('dashboard.period')}
            className="flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1"
          >
            {RANGES.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={r.id === rangeId ? 'primary' : 'ghost'}
                aria-pressed={r.id === rangeId}
                onClick={() => setRangeId(r.id)}
              >
                {t(`dashboard.ranges.${r.id}`)}
              </Button>
            ))}
          </div>
        }
      />

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <StatCard key={i} loading />
            ))}
          </div>
        }
      >
        {() => (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={t('dashboard.revenue', { range: rangeLabel })}
                value={fmtMAD(data.totalRevenue)}
                icon={Coins}
                trend={trendPct(data.totalRevenue, data.previous?.totalRevenue)}
                hint={t('dashboard.vsPrevious')}
              />
              <StatCard
                label={t('dashboard.reservations', { range: rangeLabel })}
                value={fmtNumber(data.totalReservations)}
                icon={TicketCheck}
                trend={trendPct(data.totalReservations, data.previous?.totalReservations)}
                hint={t('dashboard.vsPrevious')}
              />
              <StatCard label={t('dashboard.partnerParkings')} value={fmtNumber(data.totalParkings)} icon={SquareParking} />
              <StatCard
                label={t('dashboard.today')}
                value={fmtNumber(data.reservationsToday)}
                icon={CalendarCheck}
                hint={t('dashboard.activeParkings', {
                  count: data.parkingsWithReservationsToday ?? 0,
                  n: fmtNumber(data.parkingsWithReservationsToday ?? 0),
                })}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title={t('dashboard.best')} description={t('dashboard.over', { range: rangeLabel })} />
                <CardBody>
                  {data.bestParking ? (
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-md bg-spot-free-bg text-spot-free">
                        <Award aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">{data.bestParking.name}</p>
                        <p className="text-sm text-text-muted">
                          {fmtMAD(data.bestParking.revenue)} · {bookingsText(data.bestParking.bookings)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">{t('dashboard.noBooking')}</p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title={t('dashboard.worst')} description={t('dashboard.worstHint')} />
                <CardBody>
                  {data.worstParking ? (
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-md bg-spot-occupied-bg text-spot-occupied">
                        <TrendingDown aria-hidden="true" className="size-5 rtl:-scale-x-100" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">{data.worstParking.name}</p>
                        <p className="text-sm text-text-muted">
                          {fmtMAD(data.worstParking.revenue)} · {bookingsText(data.worstParking.bookings)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">{t('dashboard.noBooking')}</p>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title={t('dashboard.revenuePerMonth')} isEmpty={!revenueSeries.length}>
                <AreaChart data={revenueSeries} margin={axes.margin({ top: 8, right: 8, bottom: 0, left: -12 })}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...axes.x} />
                  <YAxis {...axes.y} width={64} tickFormatter={(v) => fmtNumber(v)} />
                  <ChartTooltip formatter={(v) => [fmtMAD(v), t('dashboard.revenueSeries')]} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ChartCard>

              <ChartCard
                title={t('dashboard.perDay')}
                description={t('dashboard.perDayHint')}
                isEmpty={!daySeries.length}
              >
                <BarChart data={daySeries} margin={axes.margin({ top: 8, right: 8, bottom: 0, left: -20 })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...axes.x} />
                  <YAxis {...axes.y} allowDecimals={false} width={40} />
                  <ChartTooltip formatter={(v) => [fmtNumber(v), t('dashboard.reservationsSeries')]} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ChartCard>

              <ChartCard
                title={t('dashboard.peak')}
                description={t('dashboard.peakHint')}
                isEmpty={!hourSeries.length}
                height={240}
              >
                <LineChart data={hourSeries} margin={axes.margin({ top: 8, right: 8, bottom: 0, left: -20 })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...axes.x} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis {...axes.y} allowDecimals={false} width={40} />
                  <ChartTooltip formatter={(v) => [fmtNumber(v), t('dashboard.reservationsSeries')]} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-accent)' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartCard>

              <Card>
                <CardHeader title={t('dashboard.types')} description={t('dashboard.typesHint')} />
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone="normal" dot>
                      {t('parkingType.normal')}
                    </Badge>
                    <span className="text-sm text-text-muted">{t('dashboard.normalHint')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone="street" dot>
                      {t('parkingType.open_street')}
                    </Badge>
                    <span className="text-sm text-text-muted">{t('dashboard.streetHint')}</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </AsyncState>
    </>
  );
}
