import { useMemo, useState } from 'react';
import { UserCheck, UserPlus, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, DataTable, Drawer, Input, Modal, Select, useToast } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { adminService, errorMessage } from '../../services';
import { fmtDate } from '../../lib/format';
import { roleLabel } from '../../layouts/navConfig';

const ROLE_TONES = { admin: 'danger', parking_owner: 'primary', technicien: 'warning', user: 'success' };
const EMPTY = { fullName: '', CNE: '', email: '', phone: '', password: '', role: 'parking_owner' };

export default function AdminAccountsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const users = useAsync(() => adminService.users(), []);

  const [roleFilter, setRoleFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // The account whose status is about to change, pending confirmation.
  const [pending, setPending] = useState(null);
  const [toggling, setToggling] = useState(false);
  const me = useAuthStore((s) => s.user);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const rows = useMemo(() => {
    const list = users.data ?? [];
    return roleFilter === 'all' ? list : list.filter((u) => u.role === roleFilter);
  }, [users.data, roleFilter]);

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = t('accounts.errors.name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t('accounts.errors.email');
    if (form.password.length < 6) next.password = t('accounts.errors.password');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await adminService.createUser({
        fullName: form.fullName.trim(),
        CNE: form.CNE.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success(t('accounts.createdToast'), { description: `${form.fullName.trim()} · ${roleLabel(t, form.role)}` });
      setForm(EMPTY);
      setErrors({});
      setOpen(false);
      users.reload();
    } catch (err) {
      toast.error(t('accounts.createFailed'), { description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!pending) return;
    const enable = pending.isActive === false;
    setToggling(true);
    try {
      await adminService.setUserStatus(pending._id, enable);
      toast.success(enable ? t('accounts.status.enabledToast') : t('accounts.status.disabledToast'), {
        description: pending.fullName,
      });
      setPending(null);
      users.reload();
    } catch (err) {
      toast.error(t('accounts.status.failed'), { description: errorMessage(err) });
    } finally {
      setToggling(false);
    }
  };

  const columns = [
    { key: 'fullName', header: t('accounts.col.name') },
    { key: 'email', header: t('accounts.col.email') },
    { key: 'phone', header: t('accounts.col.phone'), render: (u) => u.phone || '—' },
    { key: 'CNE', header: t('accounts.col.cne'), render: (u) => u.CNE || '—' },
    {
      key: 'role',
      header: t('accounts.col.role'),
      value: (u) => roleLabel(t, u.role),
      render: (u) => <Badge tone={ROLE_TONES[u.role] ?? 'neutral'}>{roleLabel(t, u.role)}</Badge>,
    },
    {
      key: 'isActive',
      header: t('accounts.col.status'),
      value: (u) => (u.isActive === false ? t('accounts.status.disabled') : t('accounts.status.active')),
      render: (u) => (
        <Badge tone={u.isActive === false ? 'danger' : 'success'} dot>
          {u.isActive === false ? t('accounts.status.disabled') : t('accounts.status.active')}
        </Badge>
      ),
    },
    { key: 'createdAt', header: t('accounts.col.createdAt'), align: 'end', render: (u) => fmtDate(u.createdAt) },
    {
      key: 'actions',
      header: t('accounts.col.actions'),
      sortable: false,
      exportable: false,
      align: 'end',
      render: (u) =>
        // Nobody can lock themselves out of the console.
        String(u._id) === String(me?._id) ? null : (
          <Button size="sm" variant={u.isActive === false ? 'secondary' : 'ghost'} onClick={() => setPending(u)}>
            {u.isActive === false ? (
              <UserCheck aria-hidden="true" className="size-4" />
            ) : (
              <UserX aria-hidden="true" className="size-4 text-danger" />
            )}
            {u.isActive === false ? t('accounts.status.enable') : t('accounts.status.disable')}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('accounts.title')}
        description={t('accounts.description')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <UserPlus aria-hidden="true" className="size-4" />
            {t('accounts.create')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={users.loading}
        error={users.error}
        onRetry={users.reload}
        csvFileName="comptes-autopark.csv"
        caption={t('accounts.caption')}
        searchPlaceholder={t('accounts.searchPlaceholder')}
        emptyTitle={t('accounts.emptyTitle')}
        toolbar={
          <Select
            label={t('accounts.role')}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-48"
          >
            <option value="all">{t('accounts.allRoles')}</option>
            <option value="admin">{t('accounts.filter.admin')}</option>
            <option value="parking_owner">{t('accounts.filter.parking_owner')}</option>
            <option value="technicien">{t('accounts.filter.technicien')}</option>
            <option value="user">{t('accounts.filter.user')}</option>
          </Select>
        }
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('accounts.create')}
        description={t('accounts.drawerHint')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} loading={saving}>
              {t('accounts.submit')}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Input label={t('accounts.form.fullName')} value={form.fullName} onChange={set('fullName')} error={errors.fullName} required />
          <Input label={t('accounts.form.cne')} value={form.CNE} onChange={set('CNE')} hint={t('accounts.form.cneHint')} />
          <Input
            label={t('accounts.form.email')}
            type="email"
            dir="ltr"
            autoComplete="off"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />
          <Input label={t('accounts.form.phone')} value={form.phone} onChange={set('phone')} placeholder="+2126…" dir="ltr" />
          <Input
            label={t('accounts.form.password')}
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint={t('accounts.form.passwordHint')}
            required
          />
          <Select label={t('accounts.form.type')} value={form.role} onChange={set('role')}>
            <option value="parking_owner">{t('accounts.form.owner')}</option>
            <option value="technicien">{t('accounts.form.technician')}</option>
          </Select>
          <button type="submit" className="sr-only">
            {t('accounts.submit')}
          </button>
        </form>
      </Drawer>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.isActive === false ? t('accounts.status.enableTitle') : t('accounts.status.disableTitle')}
        className="text-start"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant={pending?.isActive === false ? 'primary' : 'danger'} onClick={toggleStatus} loading={toggling}>
              {pending?.isActive === false ? t('accounts.status.enable') : t('accounts.status.disable')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text">
          {pending?.isActive === false
            ? t('accounts.status.enableText', { name: pending?.fullName })
            : t('accounts.status.disableText', { name: pending?.fullName })}
        </p>
      </Modal>
    </>
  );
}
