import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircleParking, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button, Input, LanguageSwitch } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { HOME_BY_ROLE } from '../../layouts/navConfig';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loading, error, user, hydrated } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  // Someone already signed in should not be shown the form again.
  useEffect(() => {
    if (hydrated && user) navigate(HOME_BY_ROLE[user.role] ?? '/mobile-only', { replace: true });
  }, [hydrated, user, navigate]);

  const emailError = touched && !EMAIL_RE.test(email) ? t('auth.invalidEmail') : undefined;
  const passwordError = touched && password.length < 6 ? t('auth.passwordMin') : undefined;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email) || password.length < 6) return;
    try {
      const u = await login(email, password);
      navigate(HOME_BY_ROLE[u.role] ?? '/mobile-only', { replace: true });
    } catch {
      // The store holds the message; the alert below renders it.
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand side. Hidden on small screens so the form owns the viewport. */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-on-primary lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -end-24 size-96 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-on-primary/15 font-bold">AP</span>
          <span className="text-lg font-bold">{t('common.appName')}</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">{t('auth.heroTitle')}</h2>
          <p className="mt-3 text-on-primary/80">{t('auth.heroText')}</p>
          <ul className="mt-8 flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-3">
              <MapPin aria-hidden="true" className="size-5 shrink-0 text-accent" />
              {t('auth.feature1')}
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp aria-hidden="true" className="size-5 shrink-0 text-accent rtl:-scale-x-100" />
              {t('auth.feature2')}
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-accent" />
              {t('auth.feature3')}
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-on-primary/60">
          {t('auth.copyright', { year: new Date().getFullYear() })}
        </p>
      </section>

      {/* Form side */}
      <section className="relative flex items-center justify-center bg-bg p-6">
        {/* Reachable before signing in: someone who reads only Arabic has to be
            able to switch before they can read the form. */}
        <LanguageSwitch className="absolute top-4 end-4" />

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-md bg-primary font-bold text-on-primary">AP</span>
            <span className="text-lg font-bold text-text">{t('common.appName')}</span>
          </div>

          <h1 className="text-2xl font-bold text-text">{t('auth.title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('auth.subtitle')}</p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-md border border-danger/40 bg-spot-occupied-bg px-3 py-2.5 text-sm font-medium text-spot-occupied"
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
            <Input
              label={t('auth.email')}
              type="email"
              dir="ltr"
              autoComplete="username"
              placeholder="admin@autopark.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              required
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              required
            />
            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full justify-center">
              {t('auth.submit')}
            </Button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
            <CircleParking aria-hidden="true" className="size-4" />
            {t('auth.mobileHint')}
          </p>
        </div>
      </section>
    </div>
  );
}
