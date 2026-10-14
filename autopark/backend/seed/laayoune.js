/**
 * Static reference data for the demo network: who, where, and what people
 * write. Kept apart from seed.js so the generator reads as logic, not lists.
 *
 * Coordinates are [longitude, latitude] (GeoJSON order), placed in the
 * neighbourhoods the names refer to.
 */

const OWNERS = [
  // owner1 keeps the account every guide and screenshot refers to.
  { key: 'owner1', fullName: 'Mohammed Alami', email: 'owner1@autopark.ma', phone: '+212600000002', CNE: 'OWN001' },
  { key: 'owner2', fullName: 'Khadija Ait Lahcen', email: 'owner2@autopark.ma', phone: '+212661204587', CNE: 'OWN002' },
  { key: 'owner3', fullName: 'Brahim Ould Sidi', email: 'owner3@autopark.ma', phone: '+212662318840', CNE: 'OWN003' },
];

const TECHNICIANS = [
  { key: 'tech1', fullName: 'Youssef Benali', email: 'tech1@autopark.ma', phone: '+212600000003', CNE: 'TEC001' },
  { key: 'tech2', fullName: 'Salma El Idrissi', email: 'tech2@autopark.ma', phone: '+212663902215', CNE: 'TEC002' },
];

// ahmed and fatima are the documented demo drivers; `weight` makes them
// regulars, so their history, loyalty and wallet have something to show.
// The rest of the city's drivers are generated from NAMES below.
const DRIVERS = [
  { key: 'ahmed', fullName: 'Ahmed Sahraoui', email: 'ahmed@autopark.ma', phone: '+212600000004', CNE: 'USR001', weight: 1.2, plate: '48213-A-61' },
  { key: 'fatima', fullName: 'Fatima Zahra', email: 'fatima@autopark.ma', phone: '+212600000005', CNE: 'USR002', weight: 1.1, plate: '27390-B-61' },
  { key: 'lamine', fullName: 'Mohamed Lamine Bouh', email: 'lamine.bouh@autopark.ma', phone: '+212664117203', weight: 1, plate: '91844-D-61' },
  { key: 'aicha', fullName: 'Aïcha Mint Ahmed', email: 'aicha.mint@autopark.ma', phone: '+212665230918', weight: 1, plate: '15502-H-61' },
  { key: 'omar', fullName: 'Omar Ennaji', email: 'omar.ennaji@autopark.ma', phone: '+212666081142', weight: 1, plate: '63027-A-61' },
  { key: 'nadia', fullName: 'Nadia Belkhir', email: 'nadia.belkhir@autopark.ma', phone: '+212667342206', weight: 1, plate: '38819-W-61' },
  { key: 'sidi', fullName: 'Sidi Mohamed Ould Brahim', email: 'sidi.brahim@autopark.ma', phone: '+212668450731', weight: 1, plate: '72265-B-61' },
  { key: 'mariam', fullName: 'Mariam El Ouali', email: 'mariam.elouali@autopark.ma', phone: '+212669517824', weight: 1, plate: '20498-D-61' },
  { key: 'hamza', fullName: 'Hamza Bachir', email: 'hamza.bachir@autopark.ma', phone: '+212670628319', weight: 1, plate: '84731-A-61' },
  { key: 'khadijetou', fullName: 'Khadijetou Salek', email: 'khadijetou.salek@autopark.ma', phone: '+212671739402', weight: 1, plate: '56120-H-61' },
  { key: 'rachid', fullName: 'Rachid Tahiri', email: 'rachid.tahiri@autopark.ma', phone: '+212672840516', weight: 1, plate: '30957-W-61' },
  { key: 'zineb', fullName: 'Zineb Amrani', email: 'zineb.amrani@autopark.ma', phone: '+212673951627', weight: 1, plate: '67384-B-61' },
];

/**
 * demand: average bookings per spot per day. hours: typical stay lengths
 * (weighted). The airport sees long stays, the souk short ones.
 */
const SHORT = [[1, 35], [2, 30], [3, 18], [4, 10], [6, 5], [8, 2]];
const ERRANDS = [[1, 55], [2, 30], [3, 15]];
const TRAVEL = [[2, 20], [4, 25], [8, 20], [12, 15], [24, 20]];

const PARKINGS = [
  // ── Private car parks ──────────────────────────────────────────────
  { key: 'massira', owner: 'owner1', name: 'Parking Al Massira', type: 'normal', coordinates: [-13.2033, 27.1536],
    address: 'Avenue Al Massira, Laâyoune', totalSpots: 20, pricePerHour: 8, pricePerDay: 60, commissionPercent: 15,
    demand: 0.75, hours: SHORT },
  { key: 'centre', owner: 'owner1', name: 'Parking Centre Ville', type: 'normal', coordinates: [-13.1985, 27.1502],
    address: 'Centre Ville, Laâyoune', totalSpots: 20, pricePerHour: 10, pricePerDay: 80, commissionPercent: 12,
    demand: 0.85, hours: SHORT },
  { key: 'n5', owner: 'owner1', name: 'Parking N5', type: 'normal', coordinates: [-13.201, 27.1478],
    address: 'Route Nationale N5, Laâyoune', totalSpots: 40, pricePerHour: 6, pricePerDay: 45, commissionPercent: 10,
    demand: 0.45, hours: SHORT },
  { key: 'dchira', owner: 'owner2', name: 'Parking Place Dchira', type: 'normal', coordinates: [-13.1996, 27.1527],
    address: 'Place Dchira, Laâyoune', totalSpots: 30, pricePerHour: 9, pricePerDay: 70, commissionPercent: 12,
    demand: 0.8, hours: SHORT },
  { key: 'souk', owner: 'owner2', name: 'Parking Souk Jemal', type: 'normal', coordinates: [-13.2098, 27.1582],
    address: 'Souk Jemal, Laâyoune', totalSpots: 25, pricePerHour: 5, pricePerDay: 35, commissionPercent: 10,
    demand: 0.9, hours: ERRANDS },
  { key: 'colomina', owner: 'owner3', name: 'Parking Colomina', type: 'normal', coordinates: [-13.1938, 27.1561],
    address: 'Quartier Colomina, Laâyoune', totalSpots: 24, pricePerHour: 7, pricePerDay: 50, commissionPercent: 12,
    demand: 0.55, hours: SHORT },
  { key: 'wahda', owner: 'owner3', name: 'Parking Hay Al Wahda', type: 'normal', coordinates: [-13.2112, 27.1449],
    address: 'Hay Al Wahda, Laâyoune', totalSpots: 16, pricePerHour: 5, pricePerDay: 35, commissionPercent: 10,
    demand: 0.5, hours: SHORT },
  { key: 'airport', owner: 'owner3', name: 'Parking Aéroport Hassan Ier', type: 'normal', coordinates: [-13.2185, 27.1521],
    address: 'Aéroport Laâyoune Hassan Ier', totalSpots: 60, pricePerHour: 6, pricePerDay: 50, commissionPercent: 15,
    demand: 0.25, hours: TRAVEL },

  // ── Public street parking (voie publique) ───────────────────────────
  { key: 'kabir', owner: 'owner1', name: 'Rue Al Kabir', type: 'open_street', coordinates: [-13.195, 27.152],
    address: 'Rue Al Kabir, Laâyoune', totalSpots: 15, pricePerHour: 4, pricePerDay: 30, commissionPercent: 8,
    demand: 0.6, hours: ERRANDS },
  { key: 'hassan2', owner: 'owner1', name: 'Boulevard Hassan II', type: 'open_street', coordinates: [-13.2005, 27.1545],
    address: 'Boulevard Hassan II, Laâyoune', totalSpots: 20, pricePerHour: 4, pricePerDay: 30, commissionPercent: 8,
    demand: 0.65, hours: ERRANDS },
  { key: 'mohammed5', owner: 'owner1', name: 'Avenue Mohammed V', type: 'open_street', coordinates: [-13.2027, 27.1509],
    address: 'Avenue Mohammed V, Laâyoune', totalSpots: 25, pricePerHour: 4, pricePerDay: 30, commissionPercent: 8,
    demand: 0.7, hours: ERRANDS },
  { key: 'smara', owner: 'owner1', name: 'Avenue de Smara', type: 'open_street', coordinates: [-13.2068, 27.1488],
    address: 'Avenue de Smara, Laâyoune', totalSpots: 20, pricePerHour: 3, pricePerDay: 25, commissionPercent: 8,
    demand: 0.5, hours: ERRANDS },
  { key: 'skikima', owner: 'owner1', name: 'Avenue Skikima', type: 'open_street', coordinates: [-13.1962, 27.1473],
    address: 'Avenue Skikima, Laâyoune', totalSpots: 18, pricePerHour: 3, pricePerDay: 25, commissionPercent: 8,
    demand: 0.45, hours: ERRANDS },
];

// The wider driver community, generated by seed.js from these names.
const NAMES = {
  first: [
    'Mohamed', 'Brahim', 'Salek', 'Mahfoud', 'Hassan', 'Youssef', 'Mustapha', 'Abdellah', 'Khalil', 'Said',
    'Mbarek', 'Lahcen', 'Hamid', 'Ayoub', 'Anas', 'Ismail', 'Bilal', 'Yassine', 'Driss', 'Mohamed Salem',
    'Fatimetou', 'Salka', 'Mariem', 'Lalla', 'Hind', 'Sara', 'Imane', 'Asmae', 'Hajar', 'Ghizlane',
    'Laila', 'Naima', 'Rkia', 'Souad', 'Kaltoum', 'Yasmine', 'Oumaima', 'Najat', 'Hanane', 'Selma',
  ],
  last: [
    'El Moussaoui', 'Ould Ahmed', 'Ma El Ainin', 'Bousbaa', 'Chtouki', 'Lamrani', 'Ait Baha', 'El Kadiri',
    'Ouhaddou', 'Rguibi', 'Bouhaddou', 'Daoudi', 'Lahlou', 'Ezzahraoui', 'Sbai', 'Kettani', 'Ouali',
    'Ould Sidi Mohamed', 'Mint Salek', 'Boujemaa', 'Elhaouari', 'Tazi', 'Bachiri', 'Hilali',
  ],
};

const REWARDS = [
  { title: 'Réservation gratuite', description: 'Une réservation offerte après 5 réservations sur le réseau.',
    parking: null, requiredBookings: 5, type: 'free_reservation' },
  { title: 'Bon Marjane 50 DH', description: 'Bon d’achat Marjane de 50 DH après 10 réservations.',
    parking: 'massira', requiredBookings: 10, type: 'discount_coupon' },
  { title: 'Lavage auto gratuit', description: 'Lavage extérieur offert après 8 réservations.',
    parking: 'centre', requiredBookings: 8, type: 'free_wash' },
  { title: 'Vidange gratuite', description: 'Vidange offerte après 12 réservations.',
    parking: 'n5', requiredBookings: 12, type: 'free_vidange' },
  { title: 'Heure offerte', description: 'Une heure de stationnement offerte après 6 réservations.',
    parking: 'dchira', requiredBookings: 6, type: 'free_reservation' },
  { title: '20 % sur le stationnement longue durée', description: 'Réduction de 20 % sur un séjour de plus de 24 h après 4 réservations.',
    parking: 'airport', requiredBookings: 4, type: 'discount_coupon' },
];

// [parking, message, resolved?]
const COMPLAINTS = [
  ['massira', 'Le parking n’est pas bien éclairé la nuit, surtout au fond près des places 15 à 20.', false],
  ['centre', 'La place n°5 est occupée depuis trois jours par le même véhicule, sans réservation visible.', true],
  ['dchira', 'La barrière de sortie ne s’ouvre pas avec le QR code, j’ai attendu dix minutes un agent.', true],
  ['souk', 'Les marquages au sol sont effacés, les voitures se garent en travers et bloquent deux places.', false],
  ['airport', 'Navette vers le terminal absente le soir. Avec des bagages, la marche est longue.', false],
  ['n5', 'Nids-de-poule à l’entrée du parking, attention aux jantes.', true],
  ['hassan2', 'Un véhicule en double file empêche de sortir de la place n°12 tous les midis.', false],
  ['colomina', 'Pas de caméra ni de gardien après 22 h, je ne me sens pas en sécurité.', false],
  ['mohammed5', 'Le panneau indique 3 MAD de l’heure mais l’application m’a facturé 4 MAD.', true],
  ['wahda', 'Sable accumulé sur les places du fond après le vent de la semaine dernière.', true],
  ['massira', 'Très bon accueil du gardien, mais les toilettes sont fermées en journée.', false],
  ['centre', 'Le paiement en espèces n’a pas été enregistré, la réservation apparaît encore impayée.', true],
  ['kabir', 'Places trop étroites pour un 4x4, impossible d’ouvrir les portières.', false],
  ['dchira', 'L’ascenseur vers le niveau -1 est en panne depuis lundi.', false],
];

const FINE_REASONS = [
  'Stationnement sans réservation',
  'Dépassement de la durée réservée',
  'Stationnement gênant en double file',
  'Stationnement sur une place réservée aux personnes handicapées',
  'Véhicule garé sur deux places',
  'Stationnement devant une sortie de garage',
];

module.exports = { OWNERS, TECHNICIANS, DRIVERS, NAMES, PARKINGS, REWARDS, COMPLAINTS, FINE_REASONS };
