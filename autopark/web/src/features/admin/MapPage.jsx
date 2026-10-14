import { useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AsyncState, Badge, Button, Card, CardBody, Select } from '../../components/ui';
import { PageHeader } from '../../layouts/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { useRealtime } from '../../hooks/useRealtime';
import { parkingService } from '../../services';
import { fmtMAD, fmtNumber } from '../../lib/format';

const LAAYOUNE = [27.1536, -13.2033];

// Literal class names: Tailwind scans source text, so these cannot be built
// by interpolation.
const OCCUPANCY_BAR = {
  free: 'bg-spot-free',
  reserved: 'bg-spot-reserved',
  occupied: 'bg-spot-occupied',
  blocked: 'bg-spot-blocked',
};

const occupancyTone = (p) => {
  if (!p.totalSpots) return 'blocked';
  if (p.availableSpots === 0) return 'occupied';
  return p.availableSpots / p.totalSpots < 0.25 ? 'reserved' : 'free';
};

/**
 * Marker built from the design tokens: the disc is the parking TYPE
 * (blue = normal, gold = voie publique) and the ring is live occupancy, with
 * the free-spot count written inside so it is never colour-only.
 *
 * Using a divIcon also removes the old dependency on marker PNGs fetched from
 * raw.githubusercontent.com, which broke the map offline or behind a CSP.
 */
const buildIcon = (p, selected) => {
  const type = p.type === 'open_street' ? 'var(--color-parking-street)' : 'var(--color-parking-normal)';
  const ring = `var(--color-spot-${occupancyTone(p)})`;
  const size = selected ? 46 : 38;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${type};border:3px solid ${ring};
        box-shadow:0 2px 8px rgba(0,0,0,.35);
        display:grid;place-items:center;
        color:#fff;font-weight:700;font-size:${selected ? 15 : 13}px;
        font-family:Inter,system-ui,sans-serif;">
        ${p.availableSpots ?? 0}
      </div>`,
  });
};

function FitToParkings({ parkings }) {
  const map = useMap();
  useMemo(() => {
    const pts = parkings
      .map((p) => p.location?.coordinates)
      .filter((c) => Array.isArray(c) && c.length === 2)
      .map((c) => [c[1], c[0]]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [48, 48] });
    else if (pts.length === 1) map.setView(pts[0], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkings.length]);
  return null;
}

export default function AdminMapPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload, setData } = useAsync(() => parkingService.list(), []);

  // Live availability: patch the row in place instead of refetching, so the
  // map never flickers while someone books a spot.
  const parkingIds = useMemo(() => (data ?? []).map((p) => p._id), [data]);
  const { connected } = useRealtime(parkingIds, {
    'availability:update': (payload) =>
      setData((prev) =>
        (prev ?? []).map((p) =>
          p._id === payload.parkingId
            ? { ...p, availableSpots: payload.availableSpots, occupiedSpots: payload.occupiedSpots }
            : p
        )
      ),
  });
  const [typeFilter, setTypeFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const parkings = useMemo(() => {
    let list = (data ?? []).filter((p) => Array.isArray(p.location?.coordinates));
    if (typeFilter !== 'all') list = list.filter((p) => p.type === typeFilter);
    if (availFilter === 'available') list = list.filter((p) => p.availableSpots > 0);
    if (availFilter === 'full') list = list.filter((p) => p.availableSpots === 0);
    return list;
  }, [data, typeFilter, availFilter]);

  const current = selected && parkings.find((p) => p._id === selected._id) ? selected : null;

  return (
    <>
      <PageHeader
        title={t('map.title')}
        description={t('map.description')}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Badge tone={connected ? 'free' : 'neutral'} dot>
              {connected ? t('map.live') : t('map.offline')}
            </Badge>
            <Select label={t('map.type')} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44">
              <option value="all">{t('map.allTypes')}</option>
              <option value="normal">{t('parkingType.normal')}</option>
              <option value="open_street">{t('parkingType.open_street')}</option>
            </Select>
            <Select
              label={t('map.availability')}
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              className="w-44"
            >
              <option value="all">{t('map.allAvailability')}</option>
              <option value="available">{t('map.free')}</option>
              <option value="full">{t('map.full')}</option>
            </Select>
          </div>
        }
      />

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!loading && !error && parkings.length === 0}
        emptyTitle={t('map.emptyTitle')}
        emptyDescription={t('map.emptyHint')}
      >
        {() => (
          <div className={`grid gap-4 ${current ? 'lg:grid-cols-[1fr_22rem]' : 'grid-cols-1'}`}>
            <Card className="overflow-hidden">
              <div dir="ltr" className="h-[clamp(20rem,60vh,40rem)] w-full">
                <MapContainer center={LAAYOUNE} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  <FitToParkings parkings={parkings} />
                  {parkings.map((p) => (
                    <Marker
                      key={p._id}
                      position={[p.location.coordinates[1], p.location.coordinates[0]]}
                      icon={buildIcon(p, current?._id === p._id)}
                      eventHandlers={{ click: () => setSelected(p) }}
                      // Keyboard users can tab to markers and press Enter.
                      keyboard
                      title={t('map.markerTitle', { name: p.name, free: p.availableSpots, total: p.totalSpots })}
                      alt={t('map.markerAlt', { name: p.name, free: p.availableSpots, total: p.totalSpots })}
                    />
                  ))}
                </MapContainer>
              </div>
            </Card>

            {current && (
              <Card className="h-fit">
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-text">{current.name}</h2>
                    <p className="mt-0.5 truncate text-sm text-text-muted">{current.address || '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label={t('map.closePanel')}
                    className="grid size-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </button>
                </div>
                <CardBody className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={current.type === 'open_street' ? 'street' : 'normal'} dot>
                      {t(current.type === 'open_street' ? 'parkingType.open_street' : 'parkingType.normal')}
                    </Badge>
                    <Badge tone={occupancyTone(current)}>
                      {t('map.freeOf', { free: fmtNumber(current.availableSpots), total: fmtNumber(current.totalSpots) })}
                    </Badge>
                  </div>

                  <dl className="flex flex-col gap-2 text-sm">
                    {[
                      [t('map.pricePerHour'), fmtMAD(current.pricePerHour)],
                      [t('map.pricePerDay'), current.pricePerDay ? fmtMAD(current.pricePerDay) : '—'],
                      [
                        t('map.commission'),
                        current.commissionPercent != null ? t('common.percent', { n: fmtNumber(current.commissionPercent) }) : '—',
                      ],
                      [t('map.owner'), current.ownerId?.fullName ?? '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <dt className="text-text-muted">{label}</dt>
                        <dd className="font-medium text-text">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-text-muted">{t('map.occupancy')}</span>
                      <span className="font-semibold text-text">
                        {current.totalSpots
                          ? t('common.percent', { n: Math.round((current.occupiedSpots / current.totalSpots) * 100) })
                          : '—'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className={`h-full rounded-full ${OCCUPANCY_BAR[occupancyTone(current)]}`}
                        style={{
                          width: `${current.totalSpots ? (current.occupiedSpots / current.totalSpots) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Button variant="secondary" onClick={() => setSelected(null)}>
                    {t('common.close')}
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </AsyncState>
    </>
  );
}
