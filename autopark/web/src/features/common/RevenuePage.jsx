import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Banknote, Download, FileText, Percent, Wallet } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  Input,
  StatCard,
  useToast,
} from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { reportService } from '../../services';
import { fmtMAD, fmtNumber } from '../../lib/format';
import { ChartCard, ChartTooltip, GRID_STROKE, useChartAxes } from './ChartCard';

// Local calendar date, not UTC: toISOString() in UTC+1 turns the first of
// the month into the last day of the previous one.
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Current month by default — the period an operator actually reports on. */
const defaultRange = () => {
  const now = new Date();
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
};

const frDay = (key) => {
  const [, m, d] = key.split('-');
  return `${d}/${m}`;
};

export default function RevenuePage() {
  const { t } = useTranslation();
  const axes = useChartAxes();
  const toast = useToast();
  const [range, setRange] = useState(defaultRange);
  const [applied, setApplied] = useState(defaultRange);
  const [downloading, setDownloading] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => reportService.revenue(applied),
    [applied.from, applied.to]
  );

  const totals = data?.totals;
  const daily = useMemo(
    () => (data?.daily ?? []).map((d) => ({ ...d, label: frDay(d.date) })),
    [data]
  );

  const invalidRange = range.from > range.to;

  const download = async (format) => {
    setDownloading(format);
    try {
      const name = await reportService.download(format, applied);
      toast.success(t('revenue.downloaded', { name }));
    } catch {
      toast.error(t('revenue.downloadFailed'));
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    { key: 'name', header: t('columns.parking') },
    { key: 'bookings', header: t('revenue.col.bookings'), align: 'end', render: (r) => fmtNumber(r.bookings) },
    { key: 'hours', header: t('revenue.col.hours'), align: 'end', render: (r) => t('common.hours', { n: fmtNumber(r.hours) }) },
    { key: 'billed', header: t('revenue.billed'), align: 'end', render: (r) => fmtMAD(r.billed) },
    { key: 'collected', header: t('revenue.collected'), align: 'end', render: (r) => fmtMAD(r.collected) },
    { key: 'refunded', header: t('revenue.refunded'), align: 'end', render: (r) => fmtMAD(r.refunded) },
    {
      key: 'commission',
      header: t('revenue.commission'),
      align: 'end',
      render: (r) => t('revenue.commissionCell', { amount: fmtMAD(r.commission), pct: fmtNumber(r.commissionPercent) }),
    },
    { key: 'net', header: t('revenue.net'), align: 'end', render: (r) => <strong>{fmtMAD(r.net)}</strong> },
  ];

  return (
    <>
      <PageHeader
        title={t('revenue.title')}
        description={t('revenue.description')}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              loading={downloading === 'csv'}
              disabled={loading || !!error}
              onClick={() => download('csv')}
            >
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Button>
            <Button
              loading={downloading === 'pdf'}
              disabled={loading || !!error}
              onClick={() => download('pdf')}
            >
              <FileText className="size-4" aria-hidden="true" />
              PDF
            </Button>
          </div>
        }
      />

      <Card className="mb-5">
        <CardHeader title={t('revenue.period')} description={t('revenue.periodHint')} />
        <CardBody>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!invalidRange) setApplied(range);
            }}
          >
            <Input
              type="date"
              label={t('revenue.from')}
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
            <Input
              type="date"
              label={t('revenue.to')}
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              error={invalidRange ? t('revenue.invalidRange') : undefined}
            />
            <Button type="submit" disabled={invalidRange}>
              {t('common.apply')}
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('revenue.billed')}
          value={fmtMAD(totals?.billed ?? 0)}
          icon={Banknote}
          loading={loading}
          hint={t('common.reservations', { count: totals?.bookings ?? 0, n: fmtNumber(totals?.bookings ?? 0) })}
        />
        <StatCard
          label={t('revenue.collected')}
          value={fmtMAD(totals?.collected ?? 0)}
          icon={Wallet}
          loading={loading}
          hint={t('revenue.collectedHint')}
        />
        <StatCard
          label={t('revenue.commission')}
          value={fmtMAD(totals?.commission ?? 0)}
          icon={Percent}
          loading={loading}
          hint={t('revenue.commissionHint')}
        />
        <StatCard
          label={t('revenue.net')}
          value={fmtMAD(totals?.net ?? 0)}
          icon={Banknote}
          loading={loading}
          hint={t('revenue.netHint')}
        />
      </div>

      <div className="mb-5">
        <ChartCard
          title={t('revenue.chartTitle')}
          description={t('revenue.chartHint')}
          loading={loading}
          isEmpty={daily.length === 0}
          emptyLabel={t('revenue.chartEmpty')}
        >
          <BarChart data={daily} margin={axes.margin({ top: 8, right: 8, bottom: 0, left: 0 })}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" {...axes.x} />
            <YAxis {...axes.y} />
            <ChartTooltip formatter={(value, name) => [fmtMAD(value), name]} />
            <Bar dataKey="billed" name={t('revenue.billed')} fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="collected" name={t('revenue.collected')} fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={data?.parkings ?? []}
        getRowId={(r) => r.parkingId}
        loading={loading}
        error={error}
        onRetry={reload}
        pageSize={10}
        csvFileName="revenus-par-parking.csv"
        caption={t('revenue.caption')}
        searchPlaceholder={t('revenue.searchPlaceholder')}
        emptyTitle={t('revenue.emptyTitle')}
        emptyDescription={t('revenue.emptyHint')}
      />
    </>
  );
}
