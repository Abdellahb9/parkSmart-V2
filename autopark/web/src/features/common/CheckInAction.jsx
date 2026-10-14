import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, ScanLine } from 'lucide-react';
import { Badge, Button, Input, Modal, useToast } from '../../components/ui';
import { bookingService, errorMessage } from '../../services';
import { isolate } from '../../lib/format';

/**
 * Entry/exit validation for one booking, from the staff side.
 *
 * The driver's app shows a QR plus the same code in text; technicians scan it
 * from the mobile app, and portal staff type the code here. The server is the
 * one that checks it — and words its refusal in the UI language — so a wrong
 * code is simply refused.
 */
export default function CheckInAction({ booking, onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [mode, setMode] = useState(null); // 'in' | 'out' | null
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (booking.status !== 'active') return <span className="text-text-muted">—</span>;

  const subtitle = t('checkin.subtitle', { spot: booking.spotNumber, plate: isolate(booking.carPlate) });

  const close = () => {
    setMode(null);
    setCode('');
    setError(null);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'in') {
        await bookingService.checkIn(booking._id, code.trim());
        toast.success(t('checkin.entryOk', { spot: booking.spotNumber }));
      } else {
        await bookingService.checkOut(booking._id);
        toast.success(t('checkin.exitOk', { spot: booking.spotNumber }));
      }
      close();
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (booking.checkedInAt) {
    return (
      <>
        <div className="flex items-center justify-end gap-2">
          <Badge tone="occupied" dot>
            {t('checkin.onSite')}
          </Badge>
          <Button size="sm" variant="secondary" onClick={() => setMode('out')}>
            <LogOut className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t('checkin.exit')}
          </Button>
        </div>

        <Modal
          className="text-start"
          open={mode === 'out'}
          onClose={close}
          title={t('checkin.exitTitle')}
          description={subtitle}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                {t('common.back')}
              </Button>
              <Button loading={busy} onClick={submit}>
                {t('checkin.exitConfirm')}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-muted">{t('checkin.exitText')}</p>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setMode('in')}>
          <LogIn className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('checkin.validate')}
        </Button>
      </div>

      <Modal
        className="text-start"
        open={mode === 'in'}
        onClose={close}
        title={t('checkin.validate')}
        description={subtitle}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button loading={busy} disabled={code.trim().length < 6} onClick={submit}>
              {t('checkin.validateShort')}
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-md bg-surface-alt p-3 text-sm text-text-muted">
          <ScanLine className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{t('checkin.hint')}</p>
        </div>

        <div className="mt-4">
          <Input
            label={t('checkin.code')}
            value={code}
            autoFocus
            dir="ltr"
            spellCheck={false}
            placeholder={t('checkin.codePlaceholder')}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.trim().length >= 6) submit();
            }}
            error={error}
          />
        </div>
      </Modal>
    </>
  );
}
