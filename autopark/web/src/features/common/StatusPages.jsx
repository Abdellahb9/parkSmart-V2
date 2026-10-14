import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Compass, Smartphone, ShieldAlert } from 'lucide-react';
import { Button, Card, CardBody, LanguageSwitch } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { HOME_BY_ROLE, roleLabel } from '../../layouts/navConfig';

function Shell({ icon: Icon, tone, title, children, actions }) {
  return (
    <div className="relative grid min-h-dvh place-items-center bg-bg p-6">
      <LanguageSwitch className="absolute top-4 end-4" />
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-4 text-center">
          <span className={`grid size-14 place-items-center rounded-full ${tone}`}>
            <Icon aria-hidden="true" className="size-7" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-text">{title}</h1>
            <div className="mt-1 text-sm text-text-muted">{children}</div>
          </div>
          {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
        </CardBody>
      </Card>
    </div>
  );
}

/** Signed in with a role the portal has no screens for. */
export function MobileOnly() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <Shell
      icon={Smartphone}
      tone="bg-primary-soft text-primary"
      title={t('status.mobileOnlyTitle')}
      actions={
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          {t('status.logout')}
        </Button>
      }
    >
      <p>
        <Trans
          i18nKey="status.mobileOnlyText"
          values={{ role: roleLabel(t, user?.role) }}
          components={{ strong: <strong /> }}
        />
      </p>
    </Shell>
  );
}

/** Signed in, but not allowed on this route. */
export function Forbidden() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const home = HOME_BY_ROLE[user?.role] ?? '/login';
  return (
    <Shell
      icon={ShieldAlert}
      tone="bg-spot-occupied-bg text-spot-occupied"
      title={t('status.forbiddenTitle')}
      actions={<Button onClick={() => window.location.assign(home)}>{t('status.backHome')}</Button>}
    >
      <p>{t('status.forbiddenText')}</p>
    </Shell>
  );
}

export function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const home = HOME_BY_ROLE[user?.role] ?? '/login';
  return (
    <Shell icon={Compass} tone="bg-surface-alt text-text-muted" title={t('status.notFoundTitle')}>
      <p className="mb-3">{t('status.notFoundText')}</p>
      <Link to={home} className="text-sm font-semibold text-primary underline underline-offset-4">
        {t('status.backHome')}
      </Link>
    </Shell>
  );
}
