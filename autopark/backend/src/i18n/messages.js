/**
 * Translations for every message the API can send to a person.
 *
 * Keyed by the English text the controllers already produce, so no controller
 * changes: the language middleware swaps the string on the way out. A message
 * missing here simply goes out in English — never blank.
 */
const MESSAGES = {
  // ── Auth ────────────────────────────────────────────────────────────
  'Invalid email or password': {
    fr: 'Email ou mot de passe incorrect.',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  },
  'Email already registered': {
    fr: 'Cette adresse email est déjà utilisée.',
    ar: 'هذا البريد الإلكتروني مستعمل من قبل.',
  },
  'Not authorized': { fr: 'Accès non autorisé.', ar: 'غير مصرح لك بهذا الإجراء.' },
  'Not authorized, no token provided': {
    fr: 'Session absente. Reconnectez-vous.',
    ar: 'لا توجد جلسة. يرجى تسجيل الدخول من جديد.',
  },
  'Not authorized, token invalid': {
    fr: 'Session expirée. Reconnectez-vous.',
    ar: 'انتهت الجلسة. يرجى تسجيل الدخول من جديد.',
  },
  'User not found': { fr: 'Utilisateur introuvable.', ar: 'المستخدم غير موجود.' },
  'Trop de tentatives de connexion. Réessayez dans quelques minutes.': {
    fr: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
    ar: 'محاولات دخول كثيرة. أعد المحاولة بعد بضع دقائق.',
  },

  // Sessions (Phase 5b)
  'Not authorized, token expired': {
    fr: 'Session expirée. Reconnectez-vous.',
    ar: 'انتهت الجلسة. يرجى تسجيل الدخول من جديد.',
  },
  'This account has been disabled': {
    fr: 'Ce compte a été désactivé. Contactez l’administrateur.',
    ar: 'تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.',
  },
  'Session expired, please sign in again': {
    fr: 'Session expirée. Reconnectez-vous.',
    ar: 'انتهت الجلسة. يرجى تسجيل الدخول من جديد.',
  },
  'Refresh token required': {
    fr: 'Session absente. Reconnectez-vous.',
    ar: 'لا توجد جلسة. يرجى تسجيل الدخول من جديد.',
  },
  'Invalid refresh token': {
    fr: 'Session expirée. Reconnectez-vous.',
    ar: 'انتهت الجلسة. يرجى تسجيل الدخول من جديد.',
  },
  'Missing X-Requested-With header': {
    fr: 'Requête refusée.',
    ar: 'تم رفض الطلب.',
  },
  'Signed out': {
    fr: 'Vous êtes déconnecté.',
    ar: 'تم تسجيل الخروج.',
  },
  'Signed out on every device': {
    fr: 'Vous êtes déconnecté sur tous vos appareils.',
    ar: 'تم تسجيل الخروج من جميع أجهزتك.',
  },
  'Current password is incorrect': {
    fr: 'Le mot de passe actuel est incorrect.',
    ar: 'كلمة المرور الحالية غير صحيحة.',
  },
  'Current password is required': {
    fr: 'Saisissez votre mot de passe actuel.',
    ar: 'أدخل كلمة المرور الحالية.',
  },
  'New password must be at least 8 characters': {
    fr: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
    ar: 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.',
  },
  'The new password must be different from the current one': {
    fr: 'Le nouveau mot de passe doit être différent de l’actuel.',
    ar: 'يجب أن تختلف كلمة المرور الجديدة عن الحالية.',
  },
  'Password changed': {
    fr: 'Mot de passe modifié. Vos autres appareils ont été déconnectés.',
    ar: 'تم تغيير كلمة المرور. تم تسجيل الخروج من أجهزتك الأخرى.',
  },
  'You cannot disable your own account': {
    fr: 'Vous ne pouvez pas désactiver votre propre compte.',
    ar: 'لا يمكنك تعطيل حسابك الخاص.',
  },
  'isActive must be true or false': {
    fr: 'Statut invalide.',
    ar: 'حالة غير صالحة.',
  },
  'Too many attempts, please try again later': {
    fr: 'Trop de tentatives. Réessayez dans quelques minutes.',
    ar: 'محاولات كثيرة. أعد المحاولة بعد بضع دقائق.',
  },

  // ── Validation ──────────────────────────────────────────────────────
  'Validation failed': { fr: 'Certains champs sont invalides.', ar: 'بعض الحقول غير صالحة.' },
  'Invalid id': { fr: 'Identifiant invalide.', ar: 'معرّف غير صالح.' },
  'Full name is required': { fr: 'Le nom complet est requis.', ar: 'الاسم الكامل مطلوب.' },
  'Valid email is required': { fr: 'Saisissez une adresse email valide.', ar: 'أدخل بريدًا إلكترونيًا صالحًا.' },
  'Password is required': { fr: 'Le mot de passe est requis.', ar: 'كلمة المرور مطلوبة.' },
  'Password must be at least 6 characters': {
    fr: 'Le mot de passe doit contenir au moins 6 caractères.',
    ar: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
  },
  'Role must be parking_owner or technicien': {
    fr: 'Le rôle doit être propriétaire ou technicien.',
    ar: 'يجب أن يكون الدور مالكًا أو تقنيًا.',
  },
  'Can only create parking_owner or technicien accounts': {
    fr: 'Seuls les comptes propriétaire et technicien se créent ici.',
    ar: 'يمكن هنا إنشاء حسابات المالكين والتقنيين فقط.',
  },
  'Parking name is required': { fr: 'Le nom du parking est requis.', ar: 'اسم الموقف مطلوب.' },
  'Owner is required': { fr: 'Le propriétaire est requis.', ar: 'المالك مطلوب.' },
  'Invalid owner. Must be an existing parking_owner account.': {
    fr: 'Propriétaire invalide : choisissez un compte propriétaire existant.',
    ar: 'مالك غير صالح: اختر حساب مالك موجودًا.',
  },
  'Type must be normal or open_street': {
    fr: 'Le type doit être « normal » ou « voie publique ».',
    ar: 'يجب أن يكون النوع «عادي» أو «الطريق العام».',
  },
  'Valid latitude is required': { fr: 'Latitude invalide.', ar: 'خط العرض غير صالح.' },
  'Valid longitude is required': { fr: 'Longitude invalide.', ar: 'خط الطول غير صالح.' },
  'Total spots must be at least 1': {
    fr: 'Il faut au moins une place.',
    ar: 'يجب أن يحتوي الموقف على مكان واحد على الأقل.',
  },
  'Price per hour is required': { fr: 'Le prix horaire est requis.', ar: 'ثمن الساعة مطلوب.' },
  'Parking ID is required': { fr: 'Le parking est requis.', ar: 'الموقف مطلوب.' },
  'Spot number is required': { fr: 'Le numéro de place est requis.', ar: 'رقم المكان مطلوب.' },
  'Car plate is required': {
    fr: 'La plaque d’immatriculation est requise.',
    ar: 'لوحة الترقيم مطلوبة.',
  },
  'Valid start time is required': { fr: 'Heure de début invalide.', ar: 'وقت البداية غير صالح.' },
  'Valid end time is required': { fr: 'Heure de fin invalide.', ar: 'وقت النهاية غير صالح.' },
  'Street parking ID is required': { fr: 'La rue est requise.', ar: 'الشارع مطلوب.' },
  'Reason is required': { fr: 'Le motif est requis.', ar: 'السبب مطلوب.' },
  'Title is required': { fr: 'Le titre est requis.', ar: 'العنوان مطلوب.' },
  'Required bookings must be at least 1': {
    fr: 'Il faut au moins une réservation.',
    ar: 'يجب أن يكون عدد الحجوزات واحدًا على الأقل.',
  },
  'Invalid reward type': { fr: 'Type de récompense invalide.', ar: 'نوع المكافأة غير صالح.' },
  'Unsupported method': { fr: 'Moyen de paiement non pris en charge.', ar: 'وسيلة الأداء غير مدعومة.' },

  // ── Parkings ────────────────────────────────────────────────────────
  'Parking not found': { fr: 'Parking introuvable.', ar: 'الموقف غير موجود.' },
  'Valid latitude and longitude are required': {
    fr: 'Position invalide.',
    ar: 'الموقع غير صالح.',
  },
  'Open street parking not found': { fr: 'Rue introuvable.', ar: 'الشارع غير موجود.' },
  'Must be an open street parking': {
    fr: 'Ce parking n’est pas une voie publique.',
    ar: 'هذا الموقف ليس من الطريق العام.',
  },
  'Spot is not available or parking not found': {
    fr: 'Cette place vient d’être prise. Choisissez-en une autre.',
    ar: 'تم حجز هذا المكان للتو. اختر مكانًا آخر.',
  },

  // ── Bookings ────────────────────────────────────────────────────────
  'Booking not found': { fr: 'Réservation introuvable.', ar: 'الحجز غير موجود.' },
  'End time must be after start time': {
    fr: 'La fin doit être après le début.',
    ar: 'يجب أن تكون النهاية بعد البداية.',
  },
  'Start time cannot be in the past': {
    fr: 'Le début ne peut pas être dans le passé.',
    ar: 'لا يمكن أن تكون البداية في الماضي.',
  },
  'Bookings can be made at most 30 days ahead': {
    fr: 'Les réservations sont ouvertes 30 jours à l’avance au maximum.',
    ar: 'يمكن الحجز قبل 30 يومًا كحد أقصى.',
  },
  'This spot is already booked for that time': {
    fr: 'Cette place est déjà réservée sur ce créneau.',
    ar: 'هذا المكان محجوز بالفعل في هذه الفترة.',
  },
  'This spot is busy, please try again': {
    fr: 'Cette place est en cours de réservation. Réessayez.',
    ar: 'يجري حجز هذا المكان الآن. أعد المحاولة.',
  },
  'The spot is booked by someone else after your slot': {
    fr: 'La place est réservée par quelqu’un d’autre après votre créneau.',
    ar: 'المكان محجوز من طرف شخص آخر بعد فترتك.',
  },
  'Too early: this booking has not started yet': {
    fr: 'Trop tôt : cette réservation n’a pas encore commencé.',
    ar: 'مبكر جدًا: لم يبدأ هذا الحجز بعد.',
  },
  'This booking has ended': { fr: 'Cette réservation est terminée.', ar: 'انتهى هذا الحجز.' },
  'Booking not found or not active': {
    fr: 'Réservation introuvable ou terminée.',
    ar: 'الحجز غير موجود أو منتهٍ.',
  },
  'Booking cancelled': { fr: 'Réservation annulée.', ar: 'تم إلغاء الحجز.' },
  'Booking completed': { fr: 'Réservation terminée.', ar: 'انتهى الحجز.' },
  'Booking extended': { fr: 'Réservation prolongée.', ar: 'تم تمديد الحجز.' },
  'Booking already completed or cancelled': {
    fr: 'Cette réservation est déjà terminée ou annulée.',
    ar: 'هذا الحجز منتهٍ أو ملغى من قبل.',
  },
  'Not authorized to view this booking': {
    fr: 'Cette réservation ne vous appartient pas.',
    ar: 'هذا الحجز ليس لك.',
  },
  'Not authorized to cancel this booking': {
    fr: 'Vous ne pouvez pas annuler cette réservation.',
    ar: 'لا يمكنك إلغاء هذا الحجز.',
  },
  'Not authorized to complete this booking': {
    fr: 'Vous ne gérez pas ce parking.',
    ar: 'أنت لا تسيّر هذا الموقف.',
  },
  'Not authorized to extend this booking': {
    fr: 'Vous ne pouvez pas prolonger cette réservation.',
    ar: 'لا يمكنك تمديد هذا الحجز.',
  },
  'Only an active booking can be extended': {
    fr: 'Seule une réservation en cours peut être prolongée.',
    ar: 'لا يمكن تمديد إلا حجز جارٍ.',
  },
  'Invalid end time': { fr: 'Heure de fin invalide.', ar: 'وقت النهاية غير صالح.' },
  'The new end time must be later than the current one': {
    fr: 'La nouvelle fin doit être après la fin actuelle.',
    ar: 'يجب أن تكون النهاية الجديدة بعد النهاية الحالية.',
  },
  'A booking cannot exceed 24 hours': {
    fr: 'Une réservation ne peut pas dépasser 24 heures.',
    ar: 'لا يمكن أن يتجاوز الحجز 24 ساعة.',
  },
  'Not authorized to validate this booking': {
    fr: 'Vous ne gérez pas ce parking.',
    ar: 'أنت لا تسيّر هذا الموقف.',
  },
  'Invalid QR code for this booking': {
    fr: 'Code incorrect pour cette réservation.',
    ar: 'الرمز غير صحيح لهذا الحجز.',
  },
  'This booking is no longer active': {
    fr: 'Cette réservation n’est plus active.',
    ar: 'هذا الحجز لم يعد نشطًا.',
  },
  'This booking is already checked in': {
    fr: 'L’entrée a déjà été validée.',
    ar: 'تم تأكيد الدخول من قبل.',
  },
  'Checked in': { fr: 'Entrée validée.', ar: 'تم تأكيد الدخول.' },
  'Checked out': { fr: 'Sortie enregistrée.', ar: 'تم تسجيل الخروج.' },

  'QR code is required': { fr: 'Le code est requis.', ar: 'الرمز مطلوب.' },
  'Unknown QR code': {
    fr: 'Code inconnu : ce n’est pas une réservation AutoPark.',
    ar: 'رمز غير معروف: ليس حجزًا من AutoPark.',
  },

  // ── Fines ───────────────────────────────────────────────────────────
  'Photo not found': { fr: 'Photo introuvable.', ar: 'الصورة غير موجودة.' },
  'Not authorized to view this photo': {
    fr: 'Cette photo ne vous appartient pas.',
    ar: 'هذه الصورة ليست لك.',
  },
  'Photo must be a JPEG, PNG or WebP image': {
    fr: 'La photo doit être au format JPEG, PNG ou WebP.',
    ar: 'يجب أن تكون الصورة بصيغة JPEG أو PNG أو WebP.',
  },
  'Photo must be smaller than 5 MB': {
    fr: 'La photo doit faire moins de 5 Mo.',
    ar: 'يجب أن يقل حجم الصورة عن 5 ميغابايت.',
  },

  // ── Payments ────────────────────────────────────────────────────────
  'Amount must be greater than zero': {
    fr: 'Le montant doit être supérieur à zéro.',
    ar: 'يجب أن يكون المبلغ أكبر من صفر.',
  },
  'Amount must be between 0 and 5000': {
    fr: 'Le montant doit être compris entre 1 et 5000 MAD.',
    ar: 'يجب أن يكون المبلغ بين 1 و5000 درهم.',
  },
  'Maximum top-up is 5000 MAD': {
    fr: 'La recharge est limitée à 5000 MAD.',
    ar: 'الحد الأقصى للتعبئة هو 5000 درهم.',
  },
  'Unsupported payment method': {
    fr: 'Moyen de paiement non pris en charge.',
    ar: 'وسيلة الأداء غير مدعومة.',
  },
  'Insufficient wallet balance': {
    fr: 'Solde insuffisant. Rechargez votre portefeuille.',
    ar: 'الرصيد غير كافٍ. يرجى تعبئة المحفظة.',
  },
  'Payment not found': { fr: 'Paiement introuvable.', ar: 'الأداء غير موجود.' },
  'Not authorized to pay for this booking': {
    fr: 'Cette réservation ne vous appartient pas.',
    ar: 'هذا الحجز ليس لك.',
  },
  'Not authorized to confirm this payment': {
    fr: 'Ce paiement ne vous appartient pas.',
    ar: 'هذا الأداء ليس لك.',
  },
  'Not authorized to collect this payment': {
    fr: 'Vous ne gérez pas ce parking.',
    ar: 'أنت لا تسيّر هذا الموقف.',
  },
  'This booking is already paid': {
    fr: 'Cette réservation est déjà payée.',
    ar: 'تم أداء هذا الحجز من قبل.',
  },
  'This payment is no longer pending': {
    fr: 'Ce paiement a déjà été traité.',
    ar: 'تمت معالجة هذا الأداء من قبل.',
  },
  'This payment is already collected': {
    fr: 'Ce paiement a déjà été encaissé.',
    ar: 'تم تحصيل هذا الأداء من قبل.',
  },
  'A cash payment is collected on site': {
    fr: 'Un paiement en espèces se règle sur place.',
    ar: 'الأداء نقدًا يتم في عين المكان.',
  },
  'Only a cash payment is collected on site': {
    fr: 'Seul un paiement en espèces s’encaisse sur place.',
    ar: 'لا يُحصَّل في عين المكان إلا الأداء نقدًا.',
  },
  'Paiement refusé par la banque': {
    fr: 'Paiement refusé par la banque.',
    ar: 'رفض البنك عملية الأداء.',
  },

  // ── Complaints ──────────────────────────────────────────────────────
  'Complaint not found': { fr: 'Réclamation introuvable.', ar: 'الشكاية غير موجودة.' },
  'Not authorized to resolve this complaint': {
    fr: 'Cette réclamation ne concerne pas vos parkings.',
    ar: 'هذه الشكاية لا تخص مواقفك.',
  },

  // ── Generic ─────────────────────────────────────────────────────────
  'Already exists': { fr: 'Cet élément existe déjà.', ar: 'هذا العنصر موجود بالفعل.' },
  'Malformed JSON body': { fr: 'Requête invalide.', ar: 'طلب غير صالح.' },
  'Request body too large': { fr: 'Requête trop volumineuse.', ar: 'الطلب كبير جدًا.' },
  'Server error': {
    fr: 'Erreur du serveur. Réessayez dans un instant.',
    ar: 'خطأ في الخادم. أعد المحاولة بعد لحظات.',
  },
};

/**
 * Messages with a variable part. Tried in order after the exact table.
 * Each returns null when it does not match.
 */
const PATTERNS = [
  (text, lang) => {
    const m = /^Role '([^']+)' is not authorized to access this resource$/.exec(text);
    if (!m) return null;
    return lang === 'ar' ? 'دورك لا يسمح بالوصول إلى هذه الصفحة.' : 'Votre rôle ne donne pas accès à cette ressource.';
  },
  (text, lang) => {
    const m = /^Route (.+) not found$/.exec(text);
    if (!m) return null;
    return lang === 'ar' ? 'المسار غير موجود.' : 'Adresse introuvable.';
  },
];

const SUPPORTED = ['fr', 'ar'];

const translate = (text, lang) => {
  if (typeof text !== 'string' || !SUPPORTED.includes(lang)) return text;
  const hit = MESSAGES[text];
  if (hit) return hit[lang] ?? text;
  for (const rule of PATTERNS) {
    const out = rule(text, lang);
    if (out) return out;
  }
  return text;
};

module.exports = { MESSAGES, SUPPORTED, translate };
