import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import { Badge, DataTable, Tabs } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { ownerService } from '../../services';
import CheckInAction from '../common/CheckInAction';
import { fmtDateTime, fmtDuration, fmtMAD, fmtNumber } from '../../lib/format';

/** Time left, or time overrun, recomputed every second from the page clock. */
function Countdown({ endTime, now }) {
  if (!endTime) return <span className="text-text-muted">—</span>;
  const diffMin = Math.floor((new Date(endTime).getTime() - now) / 60000);

  if (diffMin < 0) {
    return (
      <Badge tone="overstay" icon={TriangleAlert}>
        {`+${fmtDuration(-diffMin)}`}
      </Badge>
    );
  }
  return <Badge tone={diffMin <= 15 ? 'reserved' : 'free'}>{fmtDuration(diffMin)}</Badge>;
}

export default function OwnerReservationsPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => ownerService.reservations(), []);
  const now = useNow(1000);
  const [tab, setTab] = useState('active');

  const { active, completed, overtime } = data ?? { active: [], completed: [], overtime: [] };

  const rows = useMemo(() => {
    if (tab === 'completed') return completed;
    if (tab === 'overtime') return overtime;
    return active;
  }, [tab, active, completed, overtime]);

  const base = [
    { key: 'client', header: t('columns.client'), value: (b) => b.userId?.fullName ?? '', render: (b) => b.userId?.fullName ?? '—' },
    { key: 'parking', header: t('columns.parking'), value: (b) => b.parkingId?.name ?? '', render: (b) => b.parkingId?.name ?? '—' },
    { key: 'spotNumber', header: t('columns.spot'), align: 'end', render: (b) => t('common.spotNo', { n: b.spotNumber }) },
    { key: 'carPlate', header: t('columns.plate'), render: (b) => <bdi>{b.carPlate}</bdi> },
    { key: 'startTime', header: t('columns.start'), render: (b) => fmtDateTime(b.startTime) },
    { key: 'endTime', header: t('columns.end'), render: (b) => fmtDateTime(b.endTime) },
  ];

  const columns =
    tab === 'completed'
      ? [
          ...base,
          { key: 'totalHours', header: t('columns.duration'), align: 'end', render: (b) => t('common.hours', { n: fmtNumber(b.totalHours) }) },
          { key: 'totalPrice', header: t('columns.amount'), align: 'end', render: (b) => fmtMAD(b.totalPrice) },
        ]
      : [
          ...base,
          {
            key: 'remaining',
            header: tab === 'overtime' ? t('columns.overrun') : t('columns.remaining'),
            align: 'end',
            sortable: false,
            render: (b) => <Countdown endTime={b.endTime} now={now} />,
          },
          { key: 'totalPrice', header: t('columns.amount'), align: 'end', render: (b) => fmtMAD(b.totalPrice) },
          {
            key: 'checkin',
            header: t('columns.checkin'),
            align: 'end',
            sortable: false,
            exportable: false,
            render: (b) => <CheckInAction booking={b} onDone={reload} />,
          },
        ];

  const tabs = [
    { id: 'active', label: t('reservations.tabs.active'), badge: active.length },
    { id: 'completed', label: t('reservations.tabs.completed'), badge: completed.length },
    { id: 'overtime', label: t('reservations.tabs.overtime'), badge: overtime.length },
  ];

  const emptyByTab = {
    active: { title: t('reservations.empty.active'), description: t('reservations.empty.activeHint') },
    completed: { title: t('reservations.empty.completed'), description: undefined },
    overtime: { title: t('reservations.empty.overtime'), description: t('reservations.empty.overtimeHint') },
  };

  return (
    <>
      <PageHeader
        title={t('reservations.title')}
        description={t('reservations.ownerDescription')}
        actions={
          overtime.length > 0 ? (
            <Badge tone="overstay" icon={TriangleAlert}>
              {t('reservations.overstayBadge', { count: overtime.length, n: fmtNumber(overtime.length) })}
            </Badge>
          ) : null
        }
      />

      <Tabs items={tabs} value={tab} onChange={setTab}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          pageSize={10}
          csvFileName={`reservations-${tab}.csv`}
          caption={t('reservations.caption')}
          searchPlaceholder={t('reservations.searchPlaceholder')}
          emptyTitle={emptyByTab[tab].title}
          emptyDescription={emptyByTab[tab].description}
        />
      </Tabs>
    </>
  );
}
