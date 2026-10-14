import { Car, Gift, Sparkles, Ticket, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AsyncState, Badge, Card, CardBody } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { ownerService } from '../../services';
import { fmtNumber } from '../../lib/format';

const TYPE_ICONS = { free_reservation: Ticket, discount_coupon: Gift, free_wash: Car, free_vidange: Wrench };

export default function OwnerRewardsPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => ownerService.rewards(), []);
  const rewards = data ?? [];

  return (
    <>
      <PageHeader
        title={t('owner.rewards.title')}
        description={t('owner.rewards.description')}
      />

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!rewards.length}
        emptyIcon={Sparkles}
        emptyTitle={t('owner.rewards.emptyTitle')}
        emptyDescription={t('owner.rewards.emptyHint')}
      >
        {() => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rewards.map((r) => {
              const Icon = TYPE_ICONS[r.type] ?? Gift;
              const typeLabel = t(`owner.rewards.types.${r.type}`, { defaultValue: r.type });
              return (
                <Card key={r._id}>
                  <CardBody className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <Badge tone="neutral">{typeLabel}</Badge>
                    </div>

                    <div className="flex-1">
                      <h3 dir="auto" className="font-semibold text-text">{r.title}</h3>
                      {r.description && <p dir="auto" className="mt-1 text-sm text-text-muted">{r.description}</p>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <Badge tone="primary">
                        {t('common.reservations', { count: r.requiredBookings, n: fmtNumber(r.requiredBookings) })}
                      </Badge>
                      <span className="text-sm text-text-muted">{r.parkingId?.name ?? t('owner.rewards.allParkings')}</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncState>
    </>
  );
}
