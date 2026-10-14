import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button, Input, Modal, useToast } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { errorMessage } from '../../services';

const EMPTY = { current: '', next: '', confirm: '' };

/**
 * Password change and "sign out everywhere".
 *
 * Changing the password signs every other device out on the server; this tab
 * receives a fresh session and stays put.
 */
export default function SecurityDialog({ open, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { changePassword, logoutEverywhere } = useAuthStore();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const close = () => {
    setForm(EMPTY);
    setErrors({});
    setServerError('');
    onClose();
  };

  const validate = () => {
    const next = {};
    if (!form.current) next.current = t('security.errors.current');
    if (form.next.length < 8) next.next = t('security.errors.length');
    else if (form.next === form.current) next.next = t('security.errors.same');
    if (form.confirm !== form.next) next.confirm = t('security.errors.confirm');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await changePassword(form.current, form.next);
      toast.success(t('security.changed'), { description: t('security.changedHint') });
      close();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const signOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await logoutEverywhere();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(t('security.signOutFailed'), { description: errorMessage(err) });
      setSigningOut(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('security.title')}
      description={t('security.description')}
      className="text-start"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={saving}>
            <ShieldCheck aria-hidden="true" className="size-4" />
            {t('security.submit')}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {serverError && (
          <p role="alert" className="rounded-md bg-spot-occupied-bg px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        )}
        <Input
          label={t('security.current')}
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={set('current')}
          error={errors.current}
          required
        />
        <Input
          label={t('security.new')}
          type="password"
          autoComplete="new-password"
          value={form.next}
          onChange={set('next')}
          error={errors.next}
          hint={t('security.newHint')}
          required
        />
        <Input
          label={t('security.confirm')}
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />
        <button type="submit" className="sr-only">
          {t('security.submit')}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-text">{t('security.everywhereTitle')}</h3>
        <p className="mt-1 text-sm text-text-muted">{t('security.everywhereText')}</p>
        <Button variant="danger" size="sm" className="mt-3" onClick={signOutEverywhere} loading={signingOut}>
          <LogOut aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t('security.everywhere')}
        </Button>
      </div>
    </Modal>
  );
}
