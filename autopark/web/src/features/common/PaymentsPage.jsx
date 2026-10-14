import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BanknoteArrowUp } from 'lucide-react';
import { Badge, Button, DataTable, Select, useToast } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { paymentService } from '../../services';
import { fmtDateTime, fmtMAD, fmtNumber } from '../../lib/format';

const STATUS_TONE = { paid: 'free', pending: 'reserved', failed: 'occupied', refunded: 'neutral', cancelled: 'neutral' };

/** Marks a cash payment as collected at the barrier. */
function CollectAction({ payment, onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (payment.method !== 'cash' || payment.status !== 'pending') {
    return <span className="text-text-muted">—</span>;
  }

  const collect = async () => {
    setBusy(true);
    try {
      await paymentService.collect(payment._id);
      toast.success(t('payments.collectedToast', { amount: fmtMAD(payment.amount) }));
      onDone?.();
    } catch {
      toast.error(t('payments.collectFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Button size="sm" loading={busy} onClick={collect}>
        <BanknoteArrowUp className="size-4" aria-hidden="true" />
        {t('payments.collect')}
      </Button>
    </div>
  );
}

export default function PaymentsPage() {
  const { t } = useTranslation();
  const statusLabel = (s) => t(`payments.status.${s}`, { defaultValue: s });
  const kindLabel = (k) => t(`payments.kind.${k}`, { defaultValue: k });
  const methodLabel = (m) => t(`payments.method.${m}`, { defaultValue: m });
  const { data, loading, error, reload } = useAsync(() => paymentService.list(), []);
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => {
    const list = data ?? [];
    return status === 'all' ? list : list.filter((p) => p.status === status);
  }, [data, status]);

  const pendingCash = (data ?? []).filter((p) => p.method === 'cash' && p.status === 'pending');

  const columns = [
    {
      key: 'createdAt',
      header: t('payments.col.date'),
      render: (p) => fmtDateTime(p.createdAt),
    },
    {
      key: 'client',
      header: t('payments.col.client'),
      value: (p) => p.userId?.fullName ?? '',
      render: (p) => p.userId?.fullName ?? '—',
    },
    {
      key: 'parking',
      header: t('payments.col.parking'),
      value: (p) => p.parkingId?.name ?? '',
      render: (p) => p.parkingId?.name ?? '—',
    },
    { key: 'kind', header: t('payments.col.type'), value: (p) => kindLabel(p.kind) },
    { key: 'method', header: t('payments.col.method'), value: (p) => methodLabel(p.method) },
    { key: 'amount', header: t('payments.col.amount'), align: 'end', render: (p) => fmtMAD(p.amount) },
    {
      key: 'commission',
      header: t('payments.col.commission'),
      align: 'end',
      render: (p) => (p.commission ? fmtMAD(p.commission) : '—'),
    },
    {
      key: 'status',
      header: t('payments.col.status'),
      value: (p) => statusLabel(p.status),
      render: (p) => <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{statusLabel(p.status)}</Badge>,
    },
    {
      key: 'actions',
      header: t('payments.col.collect'),
      align: 'end',
      sortable: false,
      exportable: false,
      render: (p) => <CollectAction payment={p} onDone={reload} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('payments.title')}
        description={t('payments.description')}
        actions={
          pendingCash.length > 0 ? (
            <Badge tone="reserved">
              {t('payments.pendingCash', { count: pendingCash.length, n: fmtNumber(pendingCash.length) })}
            </Badge>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        pageSize={12}
        csvFileName="paiements-autopark.csv"
        caption={t('payments.caption')}
        searchPlaceholder={t('payments.searchPlaceholder')}
        emptyTitle={t('payments.emptyTitle')}
        emptyDescription={t('payments.emptyHint')}
        toolbar={
          <Select
            aria-label={t('payments.filterLabel')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">{t('payments.filter.all')}</option>
            <option value="paid">{t('payments.filter.paid')}</option>
            <option value="pending">{t('payments.filter.pending')}</option>
            <option value="failed">{t('payments.filter.failed')}</option>
            <option value="refunded">{t('payments.filter.refunded')}</option>
          </Select>
        }
      />
    </>
  );
}
