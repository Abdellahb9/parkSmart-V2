import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, DataTable, Select } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services';
import CheckInAction from '../common/CheckInAction';
import { fmtDateTime, fmtMAD, fmtNumber, overstayMinutes, fmtDuration } from '../../lib/format';

const STATUS_TONE = { active: 'free', done: 'neutral', cancelled: 'occupied', pending: 'reserved' };

export default function AdminReservationsPage() {
  const { t } = useTranslation();
  const statusLabel = (s) => t(`bookingStatus.${s}`, { defaultValue: s });
  const { data, loading, error, reload } = useAsync(() => adminService.reservations(), []);
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const list = data ?? [];
    if (filter === 'all') return list;
    if (filter === 'overstay') return list.filter((b) => b.status === 'active' && overstayMinutes(b.endTime) > 0);
    return list.filter((b) => b.status === filter);
  }, [data, filter]);

  const columns = [
    { key: 'client', header: t('columns.client'), value: (b) => b.userId?.fullName ?? '', render: (b) => b.userId?.fullName ?? '—' },
    { key: 'parking', header: t('columns.parking'), value: (b) => b.parkingId?.name ?? '', render: (b) => b.parkingId?.name ?? '—' },
    { key: 'spotNumber', header: t('columns.spot'), align: 'end', render: (b) => t('common.spotNo', { n: b.spotNumber }) },
    { key: 'carPlate', header: t('columns.plate'), render: (b) => <bdi>{b.carPlate}</bdi> },
    { key: 'startTime', header: t('columns.start'), render: (b) => fmtDateTime(b.startTime) },
    { key: 'endTime', header: t('columns.end'), render: (b) => fmtDateTime(b.endTime) },
    { key: 'totalHours', header: t('columns.duration'), align: 'end', render: (b) => t('common.hours', { n: fmtNumber(b.totalHours) }) },
    { key: 'totalPrice', header: t('columns.amount'), align: 'end', render: (b) => fmtMAD(b.totalPrice) },
    {
      key: 'status',
      header: t('columns.status'),
      value: (b) => statusLabel(b.status),
      render: (b) => {
        const over = b.status === 'active' ? overstayMinutes(b.endTime) : 0;
        if (over > 0) return <Badge tone="overstay">{t('bookingStatus.overstay', { duration: fmtDuration(over) })}</Badge>;
        return <Badge tone={STATUS_TONE[b.status] ?? 'neutral'}>{statusLabel(b.status)}</Badge>;
      },
    },
    {
      key: 'checkin',
      header: t('columns.checkin'),
      align: 'end',
      sortable: false,
      exportable: false,
      render: (b) => <CheckInAction booking={b} onDone={reload} />,
    },
  ];

  return (
    <>
      <PageHeader title={t('reservations.title')} description={t('reservations.adminDescription')} />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        pageSize={12}
        csvFileName="reservations-autopark.csv"
        caption={t('reservations.caption')}
        searchPlaceholder={t('reservations.searchPlaceholder')}
        emptyTitle={t('reservations.emptyTitle')}
        toolbar={
          <Select label={t('columns.status')} value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
            <option value="all">{t('reservations.filter.all')}</option>
            <option value="active">{t('reservations.filter.active')}</option>
            <option value="overstay">{t('reservations.filter.overstay')}</option>
            <option value="done">{t('reservations.filter.done')}</option>
            <option value="cancelled">{t('reservations.filter.cancelled')}</option>
          </Select>
        }
      />
    </>
  );
}
