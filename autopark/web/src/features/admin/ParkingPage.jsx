import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  Input,
  Select,
  useToast,
} from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { adminService, errorMessage, parkingService } from '../../services';
import { fmtMAD, fmtNumber } from '../../lib/format';

const EMPTY = {
  name: '',
  ownerId: '',
  type: 'normal',
  latitude: '',
  longitude: '',
  address: '',
  totalSpots: '',
  pricePerHour: '',
  pricePerDay: '',
  commissionPercent: '10',
};

// Laâyoune, as a sane default so a typo cannot drop a parking in the ocean.
const CITY = { lat: 27.1536, lng: -13.2033 };

export default function AdminParkingPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const parkings = useAsync(() => parkingService.list(), []);
  const users = useAsync(() => adminService.users(), []);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const owners = useMemo(
    () => (users.data ?? []).filter((u) => u.role === 'parking_owner'),
    [users.data]
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = t('parkings.errors.name');
    if (!form.ownerId) next.ownerId = t('parkings.errors.owner');
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.latitude || Number.isNaN(lat) || lat < -90 || lat > 90) next.latitude = t('parkings.errors.latitude');
    if (!form.longitude || Number.isNaN(lng) || lng < -180 || lng > 180) next.longitude = t('parkings.errors.longitude');
    if (!form.totalSpots || Number(form.totalSpots) < 1) next.totalSpots = t('parkings.errors.spots');
    if (form.pricePerHour === '' || Number(form.pricePerHour) < 0) next.pricePerHour = t('parkings.errors.price');
    if (form.commissionPercent !== '' && (Number(form.commissionPercent) < 0 || Number(form.commissionPercent) > 100)) {
      next.commissionPercent = t('parkings.errors.commission');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await parkingService.create({
        name: form.name.trim(),
        ownerId: form.ownerId,
        type: form.type,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address.trim(),
        totalSpots: Number(form.totalSpots),
        pricePerHour: Number(form.pricePerHour),
        pricePerDay: Number(form.pricePerDay || 0),
        commissionPercent: Number(form.commissionPercent || 0),
      });
      toast.success(t('parkings.createdToast'), { description: form.name.trim() });
      setForm(EMPTY);
      setErrors({});
      setOpen(false);
      parkings.reload();
    } catch (err) {
      toast.error(t('parkings.createFailed'), { description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', header: t('parkings.col.name') },
    {
      key: 'type',
      header: t('parkings.col.type'),
      value: (p) => t(p.type === 'open_street' ? 'parkingType.open_street' : 'parkingType.normalShort'),
      render: (p) => (
        <Badge tone={p.type === 'open_street' ? 'street' : 'normal'} dot>
          {t(p.type === 'open_street' ? 'parkingType.open_street' : 'parkingType.normalShort')}
        </Badge>
      ),
    },
    { key: 'address', header: t('parkings.col.address'), wrap: true, render: (p) => p.address || '—' },
    { key: 'totalSpots', header: t('parkings.col.spots'), align: 'end', render: (p) => fmtNumber(p.totalSpots) },
    {
      key: 'availableSpots',
      header: t('parkings.col.available'),
      align: 'end',
      render: (p) => {
        const ratio = p.totalSpots ? p.availableSpots / p.totalSpots : 0;
        const tone = p.availableSpots === 0 ? 'occupied' : ratio < 0.25 ? 'reserved' : 'free';
        return <Badge tone={tone}>{`${fmtNumber(p.availableSpots)} / ${fmtNumber(p.totalSpots)}`}</Badge>;
      },
    },
    { key: 'pricePerHour', header: t('parkings.col.pricePerHour'), align: 'end', render: (p) => fmtMAD(p.pricePerHour) },
    {
      key: 'commissionPercent',
      header: t('parkings.col.commission'),
      align: 'end',
      render: (p) => t('common.percent', { n: fmtNumber(p.commissionPercent ?? 0) }),
    },
    { key: 'owner', header: t('parkings.col.owner'), value: (p) => p.ownerId?.fullName ?? '', render: (p) => p.ownerId?.fullName ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title={t('parkings.title')}
        description={t('parkings.description')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            {t('parkings.add')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={parkings.data ?? []}
        loading={parkings.loading}
        error={parkings.error}
        onRetry={parkings.reload}
        csvFileName="parkings-autopark.csv"
        caption={t('parkings.caption')}
        searchPlaceholder={t('parkings.searchPlaceholder')}
        emptyTitle={t('parkings.emptyTitle')}
        emptyDescription={t('parkings.emptyHint')}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('parkings.add')}
        description={t('parkings.drawerHint')}
        width="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} loading={saving}>
              {t('parkings.create')}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input label={t('parkings.form.name')} value={form.name} onChange={set('name')} error={errors.name} required className="sm:col-span-2" />

          <Select label={t('parkings.form.owner')} value={form.ownerId} onChange={set('ownerId')} error={errors.ownerId} required>
            <option value="">{t('common.select')}</option>
            {owners.map((o) => (
              <option key={o._id} value={o._id}>
                {o.fullName}
              </option>
            ))}
          </Select>

          <Select label={t('parkings.form.type')} value={form.type} onChange={set('type')}>
            <option value="normal">{t('parkingType.normal')}</option>
            <option value="open_street">{t('parkingType.open_street')}</option>
          </Select>

          <Input
            label={t('parkings.form.latitude')}
            type="number"
            step="any"
            value={form.latitude}
            onChange={set('latitude')}
            error={errors.latitude}
            hint={t('parkings.form.cityHint', { value: CITY.lat })}
            required
          />
          <Input
            label={t('parkings.form.longitude')}
            type="number"
            step="any"
            value={form.longitude}
            onChange={set('longitude')}
            error={errors.longitude}
            hint={t('parkings.form.cityHint', { value: CITY.lng })}
            required
          />

          <Input label={t('parkings.form.address')} value={form.address} onChange={set('address')} className="sm:col-span-2" />

          <Input
            label={t('parkings.form.spots')}
            type="number"
            min="1"
            value={form.totalSpots}
            onChange={set('totalSpots')}
            error={errors.totalSpots}
            required
          />
          <Input
            label={t('parkings.form.pricePerHour')}
            type="number"
            min="0"
            step="0.5"
            value={form.pricePerHour}
            onChange={set('pricePerHour')}
            error={errors.pricePerHour}
            required
          />
          <Input
            label={t('parkings.form.pricePerDay')}
            type="number"
            min="0"
            value={form.pricePerDay}
            onChange={set('pricePerDay')}
            hint={t('parkings.form.pricePerDayHint')}
          />
          <Input
            label={t('parkings.form.commission')}
            type="number"
            min="0"
            max="100"
            value={form.commissionPercent}
            onChange={set('commissionPercent')}
            error={errors.commissionPercent}
          />
          {/* Lets Enter submit the form without a visible duplicate button. */}
          <button type="submit" className="sr-only">
            {t('parkings.create')}
          </button>
        </form>
      </Drawer>
    </>
  );
}
