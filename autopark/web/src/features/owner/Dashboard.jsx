import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { CalendarCheck, Coins, MapPinned, Star, Trophy } from 'lucide-react';
import { AsyncState, Card, CardBody, CardHeader, StatCard } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { ChartCard, ChartTooltip, GRID_STROKE, useChartAxes } from '../common/ChartCard';
import { useAsync } from '../../hooks/useAsync';
import { ownerService } from '../../services';
import { dayName, fmtMAD, fmtNumber, hourLabel } from '../../lib/format';

const GAUGE_COLOR = (pct) =>
  pct >= 85 ? 'var(--color-spot-occupied)' : pct >= 60 ? 'var(--color-spot-reserved)' : 'var(--color-spot-free)';

function OccupancyGauge({ occupied, total }) {
  const { t } = useTranslation();
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="size-32 shrink-0" role="img" aria-label={t('owner.dashboard.occupancyAria', { pct })}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--color-surface-alt)" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={GAUGE_COLOR(pct)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
          transform="rotate(-90 70 70)"
        />
        <text
          x="70"
          y="70"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text)"
          fontSize="26"
          fontWeight="700"
        >
          {pct}%
        </text>
      </svg>
      <div>
        <p className="text-2xl font-bold text-text">
          {fmtNumber(occupied)} <span className="text-base font-semibold text-text-muted">/ {fmtNumber(total)}</span>
        </p>
        <p className="text-sm text-text-muted">{t('owner.dashboard.occupied')}</p>
        <p className="mt-2 text-sm text-text-muted">
          {t('owner.dashboard.free', { count: Math.max(0, total - occupied), n: fmtNumber(Math.max(0, total - occupied)) })}
        </p>
      </div>
    </div>
  );
}

const MEDALS = ['bg-accent-soft text-accent', 'bg-surface-alt text-text-muted', 'bg-spot-reserved-bg text-spot-reserved'];

export default function OwnerDashboard() {
  const { t, i18n } = useTranslation();
  const axes = useChartAxes();
  const { data, loading, error, reload } = useAsync(() => ownerService.dashboard(), []);

  const daySeries = useMemo(
    () => (data?.reservationsByDay ?? []).map((d) => ({ label: dayName(d._id), count: d.count })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language]
  );
  const hourSeries = useMemo(
    () => (data?.reservationsByHour ?? []).map((h) => ({ label: hourLabel(h._id), count: h.count })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language]
  );

  const hasParkings = (data?.totalSpots ?? 0) > 0;

  return (
    <>
      <PageHeader title={t('owner.dashboard.title')} description={t('owner.dashboard.description')} />

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
        empty={!loading && !error && data && !hasParkings}
        emptyIcon={MapPinned}
        emptyTitle={t('owner.dashboard.noParkings')}
        emptyDescription={t('owner.dashboard.noParkingsHint')}
      >
        {() => (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader title={t('owner.dashboard.occupancy')} description={t('owner.dashboard.occupancyHint')} />
                <CardBody>
                  <OccupancyGauge occupied={data.occupiedSpots} total={data.totalSpots} />
                </CardBody>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                <StatCard label={t('owner.dashboard.revenueTotal')} value={fmtMAD(data.revenueTotal)} icon={Coins} />
                <StatCard label={t('owner.dashboard.revenueMonth')} value={fmtMAD(data.revenueThisMonth)} icon={Coins} />
                <StatCard label={t('owner.dashboard.revenueToday')} value={fmtMAD(data.revenueToday)} icon={CalendarCheck} />
                <StatCard
                  label={t('owner.dashboard.bestSpot')}
                  value={data.bestSpot ? t('common.spotNo', { n: data.bestSpot.spotNumber }) : '—'}
                  icon={Star}
                  hint={
                    data.bestSpot
                      ? t('common.reservations', { count: data.bestSpot.bookings, n: fmtNumber(data.bestSpot.bookings) })
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title={t('owner.dashboard.perDay')} isEmpty={!daySeries.length}>
                <BarChart data={daySeries} margin={axes.margin({ top: 8, right: 8, bottom: 0, left: -20 })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...axes.x} />
                  <YAxis {...axes.y} allowDecimals={false} width={40} />
                  <ChartTooltip formatter={(v) => [fmtNumber(v), t('dashboard.reservationsSeries')]} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ChartCard>

              <ChartCard title={t('owner.dashboard.perHour')} isEmpty={!hourSeries.length}>
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
                  />
                </LineChart>
              </ChartCard>
            </div>

            <Card>
              <CardHeader title={t('owner.dashboard.loyal')} description={t('owner.dashboard.loyalHint')} />
              <CardBody>
                {data.topLoyalUsers?.length ? (
                  <ol className="grid gap-3 sm:grid-cols-3">
                    {data.topLoyalUsers.map((entry, i) => (
                      <li
                        key={entry._id ?? i}
                        className="flex items-center gap-3 rounded-md border border-border bg-surface-alt/40 p-3"
                      >
                        <span className={`grid size-10 shrink-0 place-items-center rounded-full ${MEDALS[i] ?? MEDALS[2]}`}>
                          <Trophy aria-hidden="true" className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-text">
                            {entry.userId?.fullName ?? t('common.client')}
                          </span>
                          <span className="block text-sm text-text-muted">
                            {t('common.reservations', { count: entry.bookingCount, n: fmtNumber(entry.bookingCount) })}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-text-muted">{t('owner.dashboard.noLoyal')}</p>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </AsyncState>
    </>
  );
}
