import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, DataTable, Drawer, Select, useToast } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { adminService, complaintService, errorMessage, ownerService } from '../../services';
import { fmtDateTime } from '../../lib/format';

/**
 * Shared by the admin and owner complaint screens — the two pages had drifted
 * into near-duplicates with different columns.
 */
export function ComplaintsScreen({ title, description, fetcher, csvFileName }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(fetcher, []);
  const [filter, setFilter] = useState('open');
  const [selected, setSelected] = useState(null);
  const [resolving, setResolving] = useState(false);

  const rows = useMemo(() => {
    const list = data ?? [];
    return filter === 'all' ? list : list.filter((c) => c.status === filter);
  }, [data, filter]);

  const openCount = (data ?? []).filter((c) => c.status === 'open').length;

  const resolve = async (complaint) => {
    setResolving(true);
    try {
      await complaintService.resolve(complaint._id);
      toast.success(t('complaints.resolvedToast'));
      setSelected(null);
      // Refetch rather than patching local state: an optimistic flip used to
      // stay on screen even when the request had failed.
      reload();
    } catch (err) {
      toast.error(t('complaints.resolveFailed'), { description: errorMessage(err) });
    } finally {
      setResolving(false);
    }
  };

  const columns = [
    { key: 'client', header: t('columns.client'), value: (c) => c.userId?.fullName ?? '', render: (c) => c.userId?.fullName ?? '—' },
    { key: 'parking', header: t('columns.parking'), value: (c) => c.parkingId?.name ?? '', render: (c) => c.parkingId?.name ?? '—' },
    {
      key: 'message',
      header: t('complaints.col.message'),
      width: '38%',
      wrap: true,
      // Truncated in the cell, always readable in full in the drawer.
      render: (c) => <span dir="auto" className="line-clamp-2 text-text-muted">{c.message}</span>,
    },
    { key: 'createdAt', header: t('columns.date'), render: (c) => fmtDateTime(c.createdAt) },
    {
      key: 'status',
      header: t('columns.status'),
      value: (c) => t(c.status === 'resolved' ? 'complaints.resolved' : 'complaints.open'),
      render: (c) => (
        <Badge tone={c.status === 'resolved' ? 'free' : 'reserved'}>
          {t(c.status === 'resolved' ? 'complaints.resolved' : 'complaints.open')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('complaints.col.action'),
      align: 'end',
      sortable: false,
      render: (c) => (
        <Button size="sm" variant="secondary" onClick={() => setSelected(c)}>
          {t('common.open')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={title} description={description} />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        csvFileName={csvFileName}
        caption={t('complaints.caption')}
        searchPlaceholder={t('complaints.searchPlaceholder')}
        emptyTitle={filter === 'open' ? t('complaints.emptyOpen') : t('complaints.empty')}
        emptyDescription={filter === 'open' ? t('complaints.emptyOpenHint') : undefined}
        onRowClick={setSelected}
        toolbar={
          <Select label={t('complaints.statusLabel')} value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56">
            <option value="open">{t('complaints.openCount', { n: openCount })}</option>
            <option value="resolved">{t('complaints.resolvedFilter')}</option>
            <option value="all">{t('complaints.allFilter')}</option>
          </Select>
        }
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('complaints.drawerTitle')}
        description={selected ? fmtDateTime(selected.createdAt) : undefined}
        footer={
          selected?.status === 'open' ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                {t('common.close')}
              </Button>
              <Button loading={resolving} onClick={() => resolve(selected)}>
                <Check aria-hidden="true" className="size-4" />
                {t('complaints.resolve')}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setSelected(null)}>
              {t('common.close')}
            </Button>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={selected.status === 'resolved' ? 'free' : 'reserved'}>
                {t(selected.status === 'resolved' ? 'complaints.resolved' : 'complaints.open')}
              </Badge>
              <span className="text-sm text-text-muted">{selected.parkingId?.name ?? '—'}</span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t('complaints.client')}</p>
              <p className="text-sm text-text">{selected.userId?.fullName ?? '—'}</p>
              {selected.userId?.email && <p className="text-sm text-text-muted">{selected.userId.email}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t('complaints.message')}</p>
              <p dir="auto" className="mt-1 whitespace-pre-wrap text-start text-sm text-text">{selected.message}</p>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

export default function AdminComplaintsPage() {
  const { t } = useTranslation();
  return (
    <ComplaintsScreen
      title={t('complaints.title')}
      description={t('complaints.adminDescription')}
      fetcher={adminService.complaints}
      csvFileName="reclamations-autopark.csv"
    />
  );
}

export function OwnerComplaintsPage() {
  const { t } = useTranslation();
  return (
    <ComplaintsScreen
      title={t('complaints.title')}
      description={t('complaints.ownerDescription')}
      fetcher={ownerService.complaints}
      csvFileName="reclamations-parkings.csv"
    />
  );
}
