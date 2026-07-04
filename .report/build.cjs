const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, TableOfContents, Header, Footer,
  LevelFormat, TabStopType, TabStopPosition
} = require('docx');

const IMG = path.join(__dirname, 'img');
const DXA = WidthType.DXA;
const CONTENT_W = 9360;

const NAVY = "1F3A5F";
const BLUE = "3A6BC4";
const GOLD = "F59E0B";
const GREY = "64748B";
const LIGHT = "EAF0F8";

// ---- helpers ----
function pngSize(p) { const b = fs.readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }

function img(file, displayW, align = AlignmentType.CENTER) {
  const p = path.join(IMG, file);
  const { w, h } = pngSize(p);
  const dispH = Math.round(displayW * h / w);
  return new Paragraph({
    alignment: align, spacing: { before: 60, after: 60 },
    children: [new ImageRun({
      type: 'png', data: fs.readFileSync(p),
      transformation: { width: displayW, height: dispH },
      altText: { title: file, description: file, name: file }
    })]
  });
}

function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); }
function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] }); }
function p(text, opts = {}) { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, ...opts })] }); }
function mono(text) {
  return new Paragraph({ spacing: { after: 0, before: 0 }, children: [new TextRun({ text, font: "Consolas", size: 17 })] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60 }, children: [
    typeof text === 'string' ? new TextRun(text) : text ] });
}

// ---- tables ----
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCD6E0" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function techTable(rows, widths) {
  const headerCells = ["Technologie", "Version", "Rôle"];
  const mk = (texts, isHeader) => new TableRow({
    tableHeader: isHeader,
    children: texts.map((t, i) => new TableCell({
      borders, width: { size: widths[i], type: DXA },
      shading: { fill: isHeader ? NAVY : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: t, bold: isHeader, color: isHeader ? "FFFFFF" : "000000", size: 20 })] })]
    }))
  });
  return new Table({
    width: { size: CONTENT_W, type: DXA }, columnWidths: widths,
    rows: [mk(headerCells, true), ...rows.map(r => mk(r, false))]
  });
}

// mobile screen row: image left, description right
function mobileRow(file, title, desc) {
  const imgCell = new TableCell({
    borders, width: { size: 2520, type: DXA }, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    children: [img('mob_' + file, 165)]
  });
  const txtCell = new TableCell({
    borders, width: { size: 6840, type: DXA }, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 160, right: 120 },
    children: [
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, bold: true, color: NAVY, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: desc, size: 20 })] })
    ]
  });
  return new TableRow({ children: [imgCell, txtCell] });
}
function mobileTable(rows) {
  return new Table({ width: { size: CONTENT_W, type: DXA }, columnWidths: [2520, 6840], rows });
}

// web screen block: heading + image + description
function webScreen(file, title, desc) {
  return [
    new Paragraph({ spacing: { before: 160, after: 40 }, children: [new TextRun({ text: title, bold: true, color: NAVY, size: 22 })] }),
    img('web_' + file, 600),
    new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: desc, size: 20, color: "333333" })] })
  ];
}

// =====================================================================
const children = [];

// ---------- TITLE PAGE ----------
children.push(new Paragraph({ spacing: { before: 2600 }, children: [] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
  children: [new TextRun({ text: "AutoPark", bold: true, size: 80, color: NAVY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "Système de Gestion de Parking Intelligent", size: 30, color: BLUE })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [new TextRun({ text: "Laâyoune", size: 24, color: GREY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 },
  children: [new TextRun({ text: "RAPPORT DE PROJET", bold: true, size: 36, color: "000000" })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "Architecture · Technologies · Interfaces", size: 22, color: GREY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1600 },
  children: [new TextRun({ text: "Date : 24 juin 2026", size: 22 })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- TOC ----------
children.push(h1("Table des matières"));
children.push(new TableOfContents("Table des matières", { hyperlink: true, headingStyleRange: "1-2" }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 1. PRESENTATION ----------
children.push(h1("1. Présentation du projet"));
children.push(p("AutoPark est une plateforme de gestion intelligente du stationnement conçue pour la ville de Laâyoune. Elle permet aux automobilistes de localiser, réserver et payer une place de parking, tout en offrant aux propriétaires de parkings, aux administrateurs et aux techniciens les outils nécessaires à la supervision de l'ensemble du système."));
children.push(p("Le projet est composé de trois applications complémentaires qui communiquent via une API REST commune :"));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Backend (API REST) : ", bold: true }), new TextRun("le cœur du système — authentification, logique métier et accès à la base de données.")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Application Web : ", bold: true }), new TextRun("portail d'administration pour les administrateurs et les propriétaires de parkings.")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Application Mobile : ", bold: true }), new TextRun("application destinée aux automobilistes et aux techniciens de terrain.")] })));
children.push(p("Le système gère quatre rôles d'utilisateurs : utilisateur (automobiliste), administrateur, propriétaire de parking et technicien. Il distingue également deux types de parkings : les parkings normaux (gérés par un propriétaire) et les parkings de type voie publique (stationnement sur rue, supervisé par les techniciens)."));

children.push(h2("1.1. Rôles des utilisateurs"));
children.push(techTableRoles());

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 2. TECHNOLOGIES ----------
children.push(h1("2. Technologies utilisées"));
children.push(p("L'application repose sur une architecture moderne 3-tiers : une API Node.js/Express adossée à une base MongoDB, un front-end web React et une application mobile Flutter."));

children.push(h2("2.1. Backend — API REST"));
children.push(techTable([
  ["Node.js", "24.3", "Environnement d'exécution JavaScript côté serveur"],
  ["Express", "4.21", "Framework web pour l'API REST"],
  ["MongoDB", "—", "Base de données NoSQL orientée documents"],
  ["Mongoose", "8.9", "ODM (modélisation des données MongoDB)"],
  ["jsonwebtoken (JWT)", "9.0", "Authentification par jetons"],
  ["bcryptjs", "2.4", "Hachage sécurisé des mots de passe"],
  ["express-validator", "7.2", "Validation des données entrantes"],
  ["Multer", "1.4", "Téléversement de fichiers (images)"],
  ["CORS / dotenv", "—", "Sécurité inter-domaines & configuration"],
], [2900, 1400, 5060]));

children.push(h2("2.2. Application Web — Admin & Propriétaire"));
children.push(techTable([
  ["React", "19.2", "Bibliothèque d'interfaces utilisateur"],
  ["Vite", "8.0", "Outil de build & serveur de développement"],
  ["React Router", "7.17", "Routage de l'application monopage (SPA)"],
  ["Zustand", "5.0", "Gestion d'état globale"],
  ["Axios", "1.17", "Client HTTP vers l'API"],
  ["Leaflet / react-leaflet", "1.9 / 5.0", "Cartographie interactive"],
  ["Recharts", "3.8", "Graphiques et visualisation des statistiques"],
  ["Tailwind CSS", "4.3", "Framework de styles utilitaires"],
], [2900, 1400, 5060]));

children.push(h2("2.3. Application Mobile — Flutter"));
children.push(techTable([
  ["Flutter", "3.38", "Framework UI multiplateforme"],
  ["Dart", "3.x", "Langage de programmation"],
  ["go_router", "14.8", "Navigation et routage déclaratif"],
  ["Provider", "6.1", "Gestion d'état"],
  ["http", "1.2", "Client HTTP vers l'API"],
  ["shared_preferences", "2.3", "Stockage local (session / jeton)"],
  ["flutter_map / latlong2", "7.0 / 0.9", "Cartographie OpenStreetMap"],
  ["intl", "0.19", "Formatage des dates et nombres"],
  ["flutter_svg", "2.0", "Rendu d'images vectorielles SVG"],
], [2900, 1400, 5060]));

children.push(h2("2.4. Outils & infrastructure"));
children.push(bullet("Base de données : MongoDB (locale, port 27017)."));
children.push(bullet("Cartographie : tuiles OpenStreetMap (gratuites, sans clé API)."));
children.push(bullet("Tests mobiles : émulateur Android (Pixel 10 Pro XL, API 36)."));
children.push(bullet("Gestion de versions : Git."));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 3. ARCHITECTURE & STRUCTURE ----------
children.push(h1("3. Architecture & structure du projet"));
children.push(p("Le projet suit une architecture 3-tiers découplée. Les deux clients (web et mobile) consomment la même API REST sécurisée par JWT, qui centralise toute la logique métier et l'accès aux données."));

children.push(h2("3.1. Flux d'architecture"));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [
  new TextRun({ text: "[ App Mobile Flutter ]      [ App Web React ]", font: "Consolas", size: 18 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
  new TextRun({ text: "\\                    /", font: "Consolas", size: 18 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
  new TextRun({ text: "v                  v", font: "Consolas", size: 18 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
  new TextRun({ text: "[ API REST  Node.js / Express  —  JWT ]", font: "Consolas", size: 18 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
  new TextRun({ text: "|", font: "Consolas", size: 18 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [
  new TextRun({ text: "[ Base de données MongoDB ]", font: "Consolas", size: 18 })] }));

children.push(h2("3.2. Arborescence du projet"));
const tree = [
  "autopark/",
  "├── backend/                 API REST — Node.js / Express / MongoDB",
  "│   └── src/",
  "│       ├── config/          db.js (connexion MongoDB)",
  "│       ├── controllers/     auth, parking, booking, admin,",
  "│       │                    owner, technicien, complaint, reward",
  "│       ├── middleware/      auth, role, validate",
  "│       ├── models/          User, Parking, Booking, Complaint,",
  "│       │                    Fine, LoyaltyPoints, Reward",
  "│       ├── routes/          auth, parkings, bookings, admin,",
  "│       │                    owner, technicien, complaints, rewards",
  "│       └── server.js        point d'entrée du serveur",
  "│",
  "├── web/                     Portail Admin & Propriétaire — React / Vite",
  "│   └── src/",
  "│       ├── features/admin/  Dashboard, MapPage, AccountsPage,",
  "│       │                    ParkingPage, OtherPage",
  "│       ├── features/owner/  Dashboard, ReservationsPage,",
  "│       │                    RewardsPage, OtherPage",
  "│       ├── features/auth/   LoginPage",
  "│       ├── store/           authStore.js (Zustand)",
  "│       └── router/          index.jsx",
  "│",
  "└── mobile/                  Application mobile — Flutter",
  "    └── lib/",
  "        ├── core/            api_service, app_router,",
  "        │                    auth_provider, constants",
  "        └── features/        map, booking, reservations,",
  "                             complaints, profile, auth, technicien",
];
tree.forEach(l => children.push(mono(l)));

children.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
children.push(h2("3.3. Modèles de données (MongoDB)"));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "User : ", bold: true }), new TextRun("nom, email, mot de passe (haché), téléphone, CNE, rôle (user / admin / parking_owner / technicien).")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Parking : ", bold: true }), new TextRun("nom, propriétaire, type (normal / voie publique), position GPS, adresse, nombre de places, tarifs, commission, places.")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Booking : ", bold: true }), new TextRun("utilisateur, parking, n° de place, plaque, horaires, durée, prix, statut, frais d'annulation.")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Complaint : ", bold: true }), new TextRun("réclamation d'un utilisateur sur un parking, avec statut (ouvert / résolu).")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "Fine : ", bold: true }), new TextRun("amende émise par un technicien sur un parking voie publique.")] })));
children.push(bullet(new TextRun({ children: [new TextRun({ text: "LoyaltyPoints / Reward : ", bold: true }), new TextRun("points de fidélité par parking et catalogue de récompenses.")] })));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 4. WEB ----------
children.push(h1("4. Application Web (Admin & Propriétaire)"));
children.push(p("Le portail web est une application monopage React. Après authentification, l'administrateur accède à la supervision globale du système, tandis que le propriétaire accède aux statistiques et à la gestion de ses propres parkings."));

children.push(h2("4.1. Authentification"));
webScreen('00_login.png', "Page de connexion", "Page de connexion partagée entre l'administrateur et le propriétaire. Les champs Email et Mot de passe sont validés via l'API ; l'utilisateur est ensuite redirigé selon son rôle vers l'espace /admin ou /owner.").forEach(c => children.push(c));

children.push(h2("4.2. Espace Administrateur"));
webScreen('01_admin_dashboard.png', "Tableau de bord", "Vue d'ensemble du système : revenu total, nombre de réservations, parkings partenaires, ainsi que le meilleur et le moins performant des parkings. Trois graphiques présentent le revenu par mois, les réservations par jour et les heures de pointe.").forEach(c => children.push(c));
webScreen('02_admin_map.png', "Carte des parkings", "Carte interactive (OpenStreetMap) de tous les parkings de Laâyoune. Les marqueurs bleus représentent les parkings normaux et les marqueurs dorés les parkings de type voie publique. Un clic sur un marqueur affiche le détail du parking.").forEach(c => children.push(c));
webScreen('03_admin_accounts.png', "Gestion des comptes", "Liste de tous les comptes avec leur rôle (Utilisateur, Technicien, Propriétaire, Administrateur) et formulaire de création de nouveaux comptes propriétaires ou techniciens.").forEach(c => children.push(c));
webScreen('04_admin_parking.png', "Parkings", "Tableau de l'ensemble des parkings : nom, type (badge Normal / Voie publique), nombre de places, disponibilité, prix horaire, commission et propriétaire. Un bouton permet d'ajouter un nouveau parking.").forEach(c => children.push(c));
webScreen('05_admin_other.png', "Réclamations & Promotions", "Onglets « Réclamations » et « Promotions ». Le tableau des réclamations affiche l'utilisateur, le parking, le message et le statut, avec une action de résolution.").forEach(c => children.push(c));

children.push(h2("4.3. Espace Propriétaire"));
webScreen('06_owner_dashboard.png', "Tableau de bord propriétaire", "Statistiques propres aux parkings du propriétaire : taux d'occupation des places, revenus (jour / mois / total), meilleure place, graphiques de réservations et podium des trois clients les plus fidèles.").forEach(c => children.push(c));
webScreen('07_owner_reservations.png', "Réservations", "Suivi des réservations réparties en onglets Actives, Terminées et Dépassements, avec le détail de chaque réservation (client, plaque, horaires, contact).").forEach(c => children.push(c));
webScreen('08_owner_rewards.png', "Récompenses", "Programme de fidélité destiné aux clients : réservation gratuite, bons d'achat, lavage et vidange, chacun associé à un nombre de réservations requis.").forEach(c => children.push(c));
webScreen('09_owner_other.png', "Réclamations", "Réclamations des clients concernant les parkings du propriétaire, avec leur statut et une action de résolution.").forEach(c => children.push(c));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 5. MOBILE ----------
children.push(h1("5. Application Mobile (Flutter)"));
children.push(p("L'application mobile s'adresse aux automobilistes et aux techniciens. À l'ouverture, l'automobiliste arrive sur la carte des parkings ; le technicien est dirigé vers la liste des parkings voie publique."));

children.push(h2("5.1. Espace Utilisateur (automobiliste)"));
children.push(mobileTable([
  mobileRow('01_user_map.png', "Carte", "Écran d'accueil — carte OpenStreetMap de Laâyoune. Les marqueurs bleus correspondent aux parkings normaux et les marqueurs dorés (icône de route) aux parkings voie publique. Barre de recherche en haut et navigation par onglets en bas."),
  mobileRow('05_user_map_preview.png', "Aperçu d'un parking", "Carte de prévisualisation affichée au clic d'un marqueur : nom, badge de type (Parking normal / Voie publique), adresse, places disponibles, tarif horaire et bouton « Réserver une place »."),
  mobileRow('02_user_reservations.png', "Réservations", "Réservation active avec compte à rebours (ici Boulevard Hassan II, place n°13 — un parking voie publique) et historique des réservations terminées."),
  mobileRow('03_user_complaints.png', "Réclamations", "Formulaire de nouvelle réclamation (choix du parking + message) et liste des réclamations déjà envoyées avec leur statut."),
  mobileRow('04_user_profile.png', "Profil", "Profil de l'utilisateur : informations personnelles, points de fidélité par parking et progression des récompenses."),
]));

children.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
children.push(h2("5.2. Parcours de réservation"));
children.push(mobileTable([
  mobileRow('06_booking_spots.png', "Sélection de la place", "Grille des places du parking avec une légende de couleurs : vert = disponible, rouge = occupée, doré = réservée."),
  mobileRow('07_booking_details.png', "Détails de la réservation", "Informations du client pré-remplies, saisie de la plaque d'immatriculation, plage horaire et calcul automatique du montant total à payer."),
]));

children.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
children.push(h2("5.3. Authentification"));
children.push(mobileTable([
  mobileRow('08_login.png', "Connexion", "Écran de connexion de l'application mobile (utilisateur ou technicien) avec un lien de création de compte."),
  mobileRow('09_register.png', "Inscription", "Formulaire d'inscription d'un nouvel utilisateur (nom, email, mot de passe, téléphone)."),
]));

children.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
children.push(h2("5.4. Espace Technicien"));
children.push(mobileTable([
  mobileRow('10_technicien_streets.png', "Parkings voie publique", "Liste des parkings de type voie publique (Rue Al Kabir, Boulevard Hassan II) avec leur disponibilité. Le technicien peut consulter les places et émettre des amendes."),
  mobileRow('11_technicien_profile.png', "Profil technicien", "Profil du technicien avec son badge de rôle, ses informations de contact et le bouton de déconnexion."),
]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 6. CONCLUSION ----------
children.push(h1("6. Conclusion"));
children.push(p("AutoPark constitue une solution complète et cohérente de gestion du stationnement pour la ville de Laâyoune. Grâce à son architecture 3-tiers, le système partage une même API entre un portail web d'administration et une application mobile, tout en gérant finement les rôles et les deux types de parkings (normal et voie publique)."));
children.push(p("Les technologies retenues — Node.js/Express et MongoDB côté serveur, React côté web et Flutter côté mobile — offrent un socle moderne, performant et évolutif, adapté aussi bien à la supervision administrative qu'à l'usage quotidien des automobilistes et des techniciens de terrain."));

// =====================================================================
const doc = new Document({
  creator: "AutoPark",
  title: "AutoPark — Rapport de Projet",
  numbering: { config: [
    { reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] }
  ]},
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "Calibri", color: NAVY },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 27, bold: true, font: "Calibri", color: BLUE },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Calibri", color: NAVY },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: { page: {
      size: { width: 12240, height: 15840 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
    }},
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "AutoPark — Rapport de Projet     ", size: 16, color: GREY }),
                 new TextRun({ text: "Page ", size: 16, color: GREY }),
                 new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
                 new TextRun({ text: " / ", size: 16, color: GREY }),
                 new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GREY })]
    })] }) },
    children
  }]
});

function techTableRoles() {} // placeholder (defined below via hoist)

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(__dirname, 'AutoPark_Rapport.docx'), buf);
  console.log('WROTE AutoPark_Rapport.docx (' + buf.length + ' bytes)');
}).catch(e => { console.error(e); process.exit(1); });

// ---- roles table (function hoisted) ----
function techTableRoles() {
  const widths = [2600, 6760];
  const mk = (a, b, isHeader) => new TableRow({
    tableHeader: isHeader,
    children: [a, b].map((t, i) => new TableCell({
      borders, width: { size: widths[i], type: DXA },
      shading: { fill: isHeader ? NAVY : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: t, bold: isHeader, color: isHeader ? "FFFFFF" : "000000", size: 20 })] })]
    }))
  });
  return new Table({ width: { size: CONTENT_W, type: DXA }, columnWidths: widths, rows: [
    mk("Rôle", "Description", true),
    mk("Utilisateur", "Automobiliste : recherche, réservation et paiement d'une place ; réclamations et fidélité.", false),
    mk("Administrateur", "Supervision globale : comptes, parkings, statistiques et réclamations.", false),
    mk("Propriétaire", "Gestion de ses parkings : réservations, revenus et récompenses.", false),
    mk("Technicien", "Contrôle des parkings voie publique et émission d'amendes.", false),
  ]});
}
