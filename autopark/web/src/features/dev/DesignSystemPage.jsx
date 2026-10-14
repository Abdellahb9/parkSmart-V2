import { useState } from 'react';
import { Car, CircleParking, Coins, Languages, TicketsPlane, TriangleAlert } from 'lucide-react';
import {
  AsyncState,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Select,
  Skeleton,
  SkeletonText,
  Spinner,
  StatCard,
  Tabs,
  Textarea,
  ThemeToggle,
  useToast,
} from '../../components/ui';

// Realistic Laâyoune data — no lorem, so spacing and truncation are judged
// against the lengths the real app will actually render.
const PARKINGS = [
  { _id: '1', name: 'Parking Al Massira', type: 'normal', spots: 20, free: 7, price: 8, owner: 'Mohammed Alami' },
  { _id: '2', name: 'Parking Centre Ville', type: 'normal', spots: 20, free: 20, price: 10, owner: 'Mohammed Alami' },
  { _id: '3', name: 'Parking N5', type: 'normal', spots: 40, free: 3, price: 6, owner: 'Mohammed Alami' },
  { _id: '4', name: 'Rue Al Kabir', type: 'open_street', spots: 15, free: 15, price: 4, owner: 'Ville de Laâyoune' },
  { _id: '5', name: 'Boulevard Hassan II', type: 'open_street', spots: 20, free: 19, price: 4, owner: 'Ville de Laâyoune' },
  { _id: '6', name: 'Place du Méchouar', type: 'open_street', spots: 24, free: 0, price: 5, owner: 'Ville de Laâyoune' },
];

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
      <Card>
        <CardBody className="flex flex-wrap items-start gap-4">{children}</CardBody>
      </Card>
    </section>
  );
}

export default function DesignSystemPage() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [state, setState] = useState('data');

  const toggleRtl = () => {
    const next = !rtl;
    setRtl(next);
    document.documentElement.setAttribute('dir', next ? 'rtl' : 'ltr');
  };

  const columns = [
    { key: 'name', header: 'Parking' },
    {
      key: 'type',
      header: 'Type',
      render: (r) => (
        <Badge tone={r.type === 'open_street' ? 'street' : 'normal'} dot>
          {r.type === 'open_street' ? 'Voie publique' : 'Normal'}
        </Badge>
      ),
    },
    { key: 'spots', header: 'Places', align: 'end' },
    {
      key: 'free',
      header: 'Disponibles',
      align: 'end',
      render: (r) => (
        <Badge tone={r.free === 0 ? 'occupied' : r.free < 5 ? 'reserved' : 'free'}>{r.free}</Badge>
      ),
    },
    { key: 'price', header: 'Prix/h', align: 'end', render: (r) => `${r.price} MAD` },
    { key: 'owner', header: 'Propriétaire' },
  ];

  return (
    <div className="min-h-dvh bg-bg text-text">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Design system AutoPark</h1>
            <p className="text-sm text-text-muted">
              Chaque couleur vient de <code className="text-xs">design/tokens</code>. Testez les deux thèmes et le sens
              RTL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={toggleRtl}>
              <Languages aria-hidden="true" className="size-4" />
              {rtl ? 'Passer en LTR' : 'Passer en RTL'}
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <Section title="Boutons" description="Cinq variantes, trois tailles, état de chargement.">
          <Button>Réserver</Button>
          <Button variant="secondary">Annuler</Button>
          <Button variant="ghost">Détails</Button>
          <Button variant="danger">Supprimer</Button>
          <Button variant="accent">Voie publique</Button>
          <Button loading>Enregistrement</Button>
          <Button disabled>Indisponible</Button>
          <Button size="sm">Petit</Button>
          <Button size="lg">Grand</Button>
        </Section>

        <Section title="Badges" description="Fond teinté + texte foncé : contraste conforme AA.">
          <Badge tone="normal" dot>Normal</Badge>
          <Badge tone="street" dot>Voie publique</Badge>
          <Badge tone="free">Disponible</Badge>
          <Badge tone="reserved">Réservée</Badge>
          <Badge tone="occupied">Occupée</Badge>
          <Badge tone="overstay" icon={TriangleAlert}>Dépassement</Badge>
          <Badge tone="blocked">Bloquée</Badge>
          <Badge tone="neutral">Neutre</Badge>
        </Section>

        <Section title="Champs" description="Label associé, erreur annoncée, mot de passe révélable.">
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" placeholder="ahmed@autopark.ma" required />
            <Input label="Mot de passe" type="password" placeholder="••••••••" required />
            <Input label="Plaque" placeholder="12345-A-61" hint="Format marocain" />
            <Input label="Téléphone" error="Numéro invalide" defaultValue="06" />
            <Select label="Type de parking" defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="open_street">Voie publique</option>
            </Select>
            <Textarea label="Réclamation" placeholder="Décrivez le problème…" />
          </div>
        </Section>

        <Section title="Cartes statistiques" description="Tendance par rapport à la période précédente.">
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenu total" value="12 480" unit="MAD" icon={Coins} trend={12} />
            <StatCard label="Réservations" value="317" icon={TicketsPlane} trend={-4} />
            <StatCard label="Places occupées" value="58 / 139" icon={CircleParking} />
            <StatCard label="Chargement" value="—" icon={Car} loading />
          </div>
        </Section>

        <Section title="États asynchrones" description="Chargement, vide et erreur — jamais confondus.">
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {['data', 'loading', 'empty', 'error'].map((s) => (
                <Button key={s} size="sm" variant={state === s ? 'primary' : 'secondary'} onClick={() => setState(s)}>
                  {s}
                </Button>
              ))}
            </div>
            <Card>
              <AsyncState
                loading={state === 'loading'}
                error={state === 'error' ? new Error('Le serveur est injoignable.') : null}
                empty={state === 'empty'}
                onRetry={() => setState('data')}
                emptyTitle="Aucune réservation"
                emptyDescription="Les réservations apparaîtront ici."
                emptyAction={<Button size="sm">Réserver une place</Button>}
              >
                {() => <CardBody>Contenu chargé.</CardBody>}
              </AsyncState>
            </Card>
          </div>
        </Section>

        <Section title="Squelettes et indicateurs">
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-10 w-48" />
            <SkeletonText lines={3} className="max-w-md" />
            <span className="inline-flex items-center gap-2 text-sm text-text-muted">
              <Spinner className="size-4" /> Chargement en cours
            </span>
          </div>
        </Section>

        <Section title="Onglets" description="role=tablist, navigation au clavier par flèches.">
          <Tabs
            className="w-full"
            items={[
              { id: 'active', label: 'Actives', badge: 2, content: <p className="text-sm">Deux réservations en cours.</p> },
              { id: 'done', label: 'Terminées', badge: 15, content: <p className="text-sm">Historique des séjours.</p> },
              { id: 'over', label: 'Dépassements', badge: 1, content: <p className="text-sm">Un véhicule en dépassement.</p> },
            ]}
          />
        </Section>

        <Section title="Superpositions et notifications">
          <Button onClick={() => setModal(true)}>Ouvrir une modale</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>Ouvrir un panneau</Button>
          <Button variant="ghost" onClick={() => toast.success('Réservation confirmée', { description: 'Place 12 — Parking Al Massira' })}>
            Toast succès
          </Button>
          <Button variant="ghost" onClick={() => toast.error('Place indisponible', { description: 'Quelqu’un a réservé avant vous.' })}>
            Toast erreur
          </Button>
        </Section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">Tableau de données</h2>
            <p className="text-sm text-text-muted">Recherche, tri, pagination et export CSV — une seule implémentation.</p>
          </div>
          <DataTable
            columns={columns}
            rows={PARKINGS}
            pageSize={4}
            csvFileName="parkings-laayoune.csv"
            caption="Parkings de Laâyoune"
            searchPlaceholder="Rechercher un parking…"
          />
        </section>

        <Section title="États vides et erreurs isolés">
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card>
              <EmptyState title="Aucune réclamation" description="Tout va bien pour le moment." />
            </Card>
            <Card>
              <ErrorState error={new Error('Erreur réseau')} onRetry={() => toast.info('Nouvelle tentative…')} />
            </Card>
          </div>
        </Section>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Confirmer l’annulation"
          description="Des frais de 20 % seront appliqués."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>Retour</Button>
              <Button variant="danger" onClick={() => { setModal(false); toast.warning('Réservation annulée'); }}>
                Annuler la réservation
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-muted">
            Place 12 — Parking Al Massira, aujourd’hui de 14:00 à 16:00. Montant remboursé : 12,80 MAD.
          </p>
        </Modal>

        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Boulevard Hassan II" description="Voie publique">
          <div className="flex flex-col gap-4">
            <Badge tone="street" dot>Voie publique</Badge>
            <Input label="Nom" defaultValue="Boulevard Hassan II" />
            <Input label="Prix par heure" type="number" defaultValue={4} />
            <CardFooter className="px-0">
              <Button onClick={() => { setDrawer(false); toast.success('Parking enregistré'); }}>Enregistrer</Button>
            </CardFooter>
          </div>
        </Drawer>

        <Card>
          <CardHeader title="Convention de couleur" description="Bleu = parking normal, doré = voie publique. Définie une seule fois dans domain.json." />
          <CardBody className="flex flex-wrap gap-6">
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="size-4 rounded-full bg-parking-normal" aria-hidden="true" /> Parking normal
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="size-4 rounded-full bg-parking-street" aria-hidden="true" /> Voie publique
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="size-4 rounded-full bg-spot-free" aria-hidden="true" /> Place libre
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="size-4 rounded-full bg-spot-reserved" aria-hidden="true" /> Réservée
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="size-4 rounded-full bg-spot-occupied" aria-hidden="true" /> Occupée
            </span>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
