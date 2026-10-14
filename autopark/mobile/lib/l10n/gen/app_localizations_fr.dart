// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'AutoPark';

  @override
  String get city => 'Laâyoune';

  @override
  String amountMad(String amount) {
    return '$amount MAD';
  }

  @override
  String spotNumber(int n) {
    return 'Place n°$n';
  }

  @override
  String spotAndPlate(int spot, String plate) {
    return 'Place n°$spot · $plate';
  }

  @override
  String hoursShort(int n) {
    return '$n h';
  }

  @override
  String get commonRetry => 'Réessayer';

  @override
  String get commonLoadError => 'Impossible de charger les données';

  @override
  String get commonNoData => 'Aucune donnée';

  @override
  String get commonBack => 'Retour';

  @override
  String get commonCancel => 'Annuler';

  @override
  String get commonClear => 'Effacer';

  @override
  String get commonContinue => 'Continuer';

  @override
  String get commonSend => 'Envoyer';

  @override
  String get commonFree => 'Libre';

  @override
  String get commonOccupied => 'Occupée';

  @override
  String get errTimeout =>
      'Le serveur met trop de temps à répondre. Réessayez.';

  @override
  String get errNetwork => 'Serveur injoignable. Vérifiez votre connexion.';

  @override
  String get errInvalidResponse => 'Réponse invalide du serveur.';

  @override
  String errGeneric(int code) {
    return 'Une erreur est survenue ($code).';
  }

  @override
  String get navMap => 'Carte';

  @override
  String get navReservations => 'Réservations';

  @override
  String get navComplaints => 'Réclamations';

  @override
  String get navProfile => 'Profil';

  @override
  String get navStreets => 'Voies';

  @override
  String get navScan => 'Scanner';

  @override
  String get navFines => 'Amendes';

  @override
  String get notFoundTitle => 'Page introuvable';

  @override
  String get notFoundBack => 'Retour à la carte';

  @override
  String get onbSkip => 'Passer';

  @override
  String get onbNext => 'Suivant';

  @override
  String get onbStart => 'Commencer';

  @override
  String get onb1Title => 'Trouvez une place';

  @override
  String get onb1Body =>
      'Toutes les places de Laâyoune sur une carte : parkings privés en bleu, voie publique en doré.';

  @override
  String get onb2Title => 'Réservez en quelques secondes';

  @override
  String get onb2Body =>
      'Choisissez votre place, votre créneau, et confirmez. Le prix est calculé à l’heure entamée.';

  @override
  String get onb3Title => 'Gagnez des récompenses';

  @override
  String get onb3Body =>
      'Chaque séjour terminé compte : réservation gratuite, lavage, bons d’achat chez nos partenaires.';

  @override
  String get loginTitle => 'Bon retour';

  @override
  String get loginSubtitle => 'Connectez-vous pour réserver votre place.';

  @override
  String get fieldEmail => 'Email';

  @override
  String get fieldPassword => 'Mot de passe';

  @override
  String get fieldFullName => 'Nom complet';

  @override
  String get fieldPhone => 'Téléphone';

  @override
  String get emailHint => 'vous@exemple.ma';

  @override
  String get emailRequired => 'Saisissez votre email.';

  @override
  String get emailInvalid => 'Email invalide.';

  @override
  String get passwordMin => 'Au moins 6 caractères.';

  @override
  String get passwordHelper => 'Au moins 6 caractères';

  @override
  String get showPassword => 'Afficher le mot de passe';

  @override
  String get hidePassword => 'Masquer le mot de passe';

  @override
  String get loginSubmit => 'Se connecter';

  @override
  String get loginCreateAccount => 'Créer un compte';

  @override
  String get registerTitle => 'Créer un compte';

  @override
  String get registerWelcome => 'Bienvenue';

  @override
  String get registerSubtitle =>
      'Quelques informations et vous pourrez réserver.';

  @override
  String get nameRequired => 'Saisissez votre nom.';

  @override
  String get registerSubmit => 'Créer mon compte';

  @override
  String get registerHaveAccount => 'J’ai déjà un compte';

  @override
  String get mapLoadError => 'Impossible de charger la carte';

  @override
  String get mapSearchHint => 'Rechercher un parking…';

  @override
  String mapFreeOf(int free, int total) {
    return '$free / $total libres';
  }

  @override
  String get mapFilterAll => 'Tous';

  @override
  String get mapFilterParkings => 'Parkings';

  @override
  String get mapFilterStreet => 'Voie publique';

  @override
  String get mapFilterAvailable => 'Disponibles';

  @override
  String get mapNoMatch => 'Aucun parking ne correspond';

  @override
  String get mapNoMatchHint => 'Modifiez la recherche ou les filtres.';

  @override
  String get mapRefresh => 'Actualiser';

  @override
  String get mapLocate => 'Ma position';

  @override
  String get mapLive => 'Temps réel';

  @override
  String mapMarkerSemantics(String name, int free, int total) {
    return '$name, $free places libres sur $total';
  }

  @override
  String get locationDisabled => 'Activez la localisation sur votre appareil.';

  @override
  String get locationDenied => 'Autorisation de localisation refusée.';

  @override
  String get locationBlocked =>
      'Autorisation bloquée. Activez-la dans les réglages.';

  @override
  String get parkingTypeNormal => 'Parking normal';

  @override
  String get parkingTypeNormalShort => 'Normal';

  @override
  String get parkingTypeStreet => 'Voie publique';

  @override
  String get sheetFreeSpots => 'Places libres';

  @override
  String get sheetHourly => 'Tarif horaire';

  @override
  String sheetManagedBy(String owner) {
    return 'Géré par $owner';
  }

  @override
  String get sheetReserve => 'Réserver une place';

  @override
  String get sheetFull => 'Complet';

  @override
  String get bookingTitle => 'Réservation';

  @override
  String get bookingStepSpot => 'Place';

  @override
  String get bookingStepDetails => 'Créneau';

  @override
  String get bookingStepSummary => 'Récapitulatif';

  @override
  String get bookingLoadError => 'Impossible de charger ce parking';

  @override
  String get bookingRangeOrder => 'La fin doit être après le début.';

  @override
  String get bookingRangeMax => 'Durée maximale : 24 heures.';

  @override
  String get bookingRangePast => 'Le début ne peut pas être dans le passé.';

  @override
  String get bookingConfirmed => 'Réservation confirmée';

  @override
  String bookingConfirmedDetail(int spot, int hours, String amount) {
    return 'Place n°$spot — $hours h pour $amount';
  }

  @override
  String get bookingSeeReservations => 'Voir mes réservations';

  @override
  String get bookingConfirm => 'Confirmer la réservation';

  @override
  String get bookingNoSpots => 'Aucune place déclarée';

  @override
  String get bookingNoSpotsHint =>
      'Ce parking n’a pas encore de places configurées.';

  @override
  String get bookingSelectSpot => 'Sélectionnez une place';

  @override
  String bookingFreeOf(int free, int total) {
    String _temp0 = intl.Intl.pluralLogic(
      free,
      locale: localeName,
      other: '$free places libres sur $total',
      one: '$free place libre sur $total',
    );
    return '$_temp0';
  }

  @override
  String get legendReserved => 'Réservée';

  @override
  String get spotStateFree => 'libre';

  @override
  String get spotStateReserved => 'réservée';

  @override
  String get spotStateOccupied => 'occupée';

  @override
  String get spotStateUnavailable => 'indisponible';

  @override
  String spotSemantics(int n, String state) {
    return 'Place $n, $state';
  }

  @override
  String get bookingVehicle => 'Votre véhicule';

  @override
  String get fieldPlate => 'Plaque d’immatriculation';

  @override
  String get plateHint => '12345-A-61';

  @override
  String get plateRequired => 'Saisissez votre plaque.';

  @override
  String get bookingSlot => 'Créneau';

  @override
  String get bookingStart => 'Début';

  @override
  String get bookingEnd => 'Fin';

  @override
  String get bookingBilled => 'Durée facturée';

  @override
  String get bookingEstimate => 'Estimation';

  @override
  String get bookingPriceNote =>
      'Toute heure entamée est due. Le montant final est calculé par le serveur.';

  @override
  String get bookingPlate => 'Plaque';

  @override
  String get bookingTotal => 'Total estimé';

  @override
  String get bookingCancelNote =>
      'Annulation possible, avec des frais de 20 % une fois la réservation active.';

  @override
  String get resTitle => 'Mes réservations';

  @override
  String get resEmpty => 'Aucune réservation';

  @override
  String get resEmptyHint => 'Vos réservations apparaîtront ici.';

  @override
  String get resHistory => 'Historique';

  @override
  String get resNoPast => 'Aucune réservation passée pour le moment.';

  @override
  String get resCancelTitle => 'Annuler la réservation ?';

  @override
  String resCancelBody(String amount) {
    return 'Des frais d’annulation de 20 % seront appliqués, soit environ $amount.';
  }

  @override
  String get resCancelConfirm => 'Annuler la réservation';

  @override
  String resCancelled(String amount) {
    return 'Réservation annulée · frais de $amount';
  }

  @override
  String resPaid(String amount) {
    return 'Paiement accepté · $amount';
  }

  @override
  String get resPayOnSite => 'À régler au gardien à votre arrivée.';

  @override
  String get resNoCode => 'Aucun code d’entrée pour cette réservation.';

  @override
  String resExtended(String time, String amount) {
    return 'Réservation prolongée jusqu’à $time · $amount';
  }

  @override
  String get resNoPosition => 'Position du parking indisponible.';

  @override
  String get resNavFailed => 'Impossible d’ouvrir la navigation.';

  @override
  String get resOverstay => 'Dépassement';

  @override
  String get resInProgress => 'En cours';

  @override
  String resOverstayOf(String time) {
    return 'Dépassement de $time';
  }

  @override
  String resRemainingOf(String time) {
    return 'Temps restant $time';
  }

  @override
  String get resBeyond => 'au-delà du créneau';

  @override
  String get resLeft => 'restant';

  @override
  String get resOverstayWarning =>
      'Votre créneau est dépassé : un technicien peut émettre une amende.';

  @override
  String get resEntryCode => 'Code d’entrée';

  @override
  String get resExtend => 'Prolonger';

  @override
  String get resGo => 'Y aller';

  @override
  String get resPay => 'Payer';

  @override
  String resAwaitCash(String amount) {
    return 'À régler au gardien · $amount';
  }

  @override
  String resUnpaid(String amount) {
    return 'Non payé · $amount';
  }

  @override
  String resPastLine(int spot, int hours, String amount) {
    return 'Place n°$spot · $hours h · $amount';
  }

  @override
  String get qrHint =>
      'Présentez ce code à l’entrée pour valider votre arrivée.';

  @override
  String get extendTitle => 'Prolonger la réservation';

  @override
  String get extendChoose => 'Choisissez la durée supplémentaire.';

  @override
  String extendCurrentEnd(String time) {
    return 'Fin actuelle : $time';
  }

  @override
  String extendUntil(String time) {
    return 'Jusqu’à $time';
  }

  @override
  String extendApprox(String amount) {
    return ' · environ $amount';
  }

  @override
  String get extendTooLong => 'Dépasse la limite de 24 h';

  @override
  String get extendServerNote => 'Le montant exact est calculé par le serveur.';

  @override
  String get duration30m => '30 minutes';

  @override
  String get duration1h => '1 heure';

  @override
  String get duration2h => '2 heures';

  @override
  String get duration3h => '3 heures';

  @override
  String get statusDone => 'Terminée';

  @override
  String get statusCancelled => 'Annulée';

  @override
  String get statusPending => 'En attente';

  @override
  String get cmpTitle => 'Réclamations';

  @override
  String get cmpSent => 'Réclamation envoyée';

  @override
  String get cmpReport => 'Signaler un problème';

  @override
  String get cmpParking => 'Parking concerné';

  @override
  String get cmpChooseParking => 'Choisissez un parking.';

  @override
  String get cmpMessage => 'Votre message';

  @override
  String get cmpMessageHint => 'Décrivez le problème rencontré…';

  @override
  String get cmpMessageMin => 'Au moins 10 caractères.';

  @override
  String get cmpMine => 'Mes réclamations';

  @override
  String get cmpNone => 'Aucune réclamation envoyée.';

  @override
  String get cmpResolved => 'Résolue';

  @override
  String get cmpOpen => 'En cours';

  @override
  String get profileTitle => 'Profil';

  @override
  String get profileWallet => 'Portefeuille';

  @override
  String get profileLoyalty => 'Fidélité';

  @override
  String get profileRewardsError => 'Impossible de charger vos récompenses';

  @override
  String get profileNoPoints => 'Pas encore de points';

  @override
  String get profileNoPointsHint =>
      'Vos points s’accumulent à chaque séjour terminé.';

  @override
  String profileStays(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count séjours',
      one: '$count séjour',
    );
    return '$_temp0';
  }

  @override
  String get profileRewards => 'Récompenses';

  @override
  String get profileSettings => 'Réglages';

  @override
  String get profileLogout => 'Déconnexion';

  @override
  String get logoutTitle => 'Se déconnecter ?';

  @override
  String get logoutBody =>
      'Vous devrez saisir à nouveau votre email et votre mot de passe.';

  @override
  String get logoutStay => 'Rester connecté';

  @override
  String get logoutConfirm => 'Se déconnecter';

  @override
  String get walletBalance => 'Solde';

  @override
  String get walletUnavailable => 'Indisponible';

  @override
  String rewardProgress(int current, int required) {
    return '$current / $required séjours';
  }

  @override
  String get themeTitle => 'Thème';

  @override
  String get themeLight => 'Clair';

  @override
  String get themeDark => 'Sombre';

  @override
  String get themeSystem => 'Système';

  @override
  String get languageTitle => 'Langue';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageArabic => 'العربية';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get comingSoon => 'Bientôt disponible';

  @override
  String get roleTechnician => 'Technicien';

  @override
  String get walletTitle => 'Portefeuille';

  @override
  String get walletLoadError => 'Impossible de charger votre portefeuille';

  @override
  String get walletHistory => 'Historique';

  @override
  String get walletEmpty => 'Aucun mouvement pour le moment.';

  @override
  String get walletAvailable => 'Solde disponible';

  @override
  String get walletTopUp => 'Recharger';

  @override
  String walletToppedUp(String amount) {
    return 'Portefeuille rechargé de $amount';
  }

  @override
  String get walletTopUpRefused => 'Recharge refusée.';

  @override
  String get walletTopUpTitle => 'Recharger le portefeuille';

  @override
  String get walletTopUpHint =>
      'Le montant est débité de votre carte bancaire.';

  @override
  String get walletOtherAmount => 'Autre montant';

  @override
  String get walletAmountHint => 'ex. 75';

  @override
  String get walletLimits => 'Entre 1 et 5000 MAD.';

  @override
  String get walletChoose => 'Choisissez un montant';

  @override
  String get payStatusPaid => 'Payé';

  @override
  String get payStatusPending => 'En attente';

  @override
  String get payStatusFailed => 'Échoué';

  @override
  String get payStatusRefunded => 'Remboursé';

  @override
  String get payStatusCancelled => 'Annulé';

  @override
  String get paymentKindTopup => 'Recharge';

  @override
  String get paymentKindRefund => 'Remboursement';

  @override
  String get paymentKindBooking => 'Stationnement';

  @override
  String get methodWallet => 'Portefeuille';

  @override
  String get methodCard => 'Carte bancaire';

  @override
  String get methodCash => 'Espèces sur place';

  @override
  String get payTitle => 'Paiement';

  @override
  String payDetail(int spot, int hours) {
    return 'Place n°$spot · $hours h';
  }

  @override
  String get payTotal => 'Total à payer';

  @override
  String get payReadingBalance => 'Lecture du solde…';

  @override
  String get payBalanceUnavailable => 'Solde indisponible';

  @override
  String payBalance(String amount) {
    return 'Solde $amount';
  }

  @override
  String payBalanceLow(String amount) {
    return 'Solde insuffisant ($amount)';
  }

  @override
  String get payCardSubtitle => 'Débit immédiat';

  @override
  String get payCashSubtitle => 'À régler au gardien à l’entrée';

  @override
  String get payOnSite => 'Payer sur place';

  @override
  String payAmount(String amount) {
    return 'Payer $amount';
  }

  @override
  String get payRefused => 'Paiement refusé. Essayez un autre moyen.';

  @override
  String get streetsTitle => 'Voie publique';

  @override
  String get streetsEmpty => 'Aucune voie publique';

  @override
  String get streetsEmptyHint =>
      'Aucun stationnement sur voie publique n’est déclaré.';

  @override
  String get streetsSearch => 'Rechercher une voie…';

  @override
  String streetsNoResult(String query) {
    return 'Aucun résultat pour « $query ».';
  }

  @override
  String streetsStats(int free, int occupied, int total) {
    return '$free libres · $occupied occupées sur $total';
  }

  @override
  String get spotFreeTitle => 'Place libre';

  @override
  String spotOverstaySince(String time) {
    return 'Dépassement depuis $time';
  }

  @override
  String spotUntil(String time) {
    return 'Jusqu’à $time';
  }

  @override
  String get badgeFine => 'Amende';

  @override
  String get fineTitle => 'Émettre une amende';

  @override
  String fineSubtitle(String street, int spot) {
    return '$street · place n°$spot';
  }

  @override
  String get finePlate => 'Plaque';

  @override
  String get finePlateRequired => 'Saisissez la plaque.';

  @override
  String get fineReason => 'Motif';

  @override
  String get fineReasonRequired => 'Précisez le motif.';

  @override
  String get fineSubmit => 'Émettre l’amende';

  @override
  String get fineReasonOverstay => 'Dépassement de la durée';

  @override
  String get fineReasonNoBooking => 'Stationnement sans réservation';

  @override
  String get fineReasonObstruction => 'Stationnement gênant';

  @override
  String get finePhoto => 'Photo de la plaque';

  @override
  String get fineAddPhoto => 'Prendre une photo';

  @override
  String get fineRetakePhoto => 'Reprendre';

  @override
  String get fineRemovePhoto => 'Retirer la photo';

  @override
  String get finePhotoHint =>
      'Une photo de la plaque sert de preuve en cas de contestation.';

  @override
  String get finePhotoFailed => 'Impossible d’ouvrir l’appareil photo.';

  @override
  String get fineIssued => 'Amende émise';

  @override
  String get fineIssuedWithPhoto => 'Amende émise avec photo';

  @override
  String get finesTitle => 'Amendes émises';

  @override
  String get finesEmpty => 'Aucune amende émise';

  @override
  String get finesEmptyHint => 'Les amendes que vous émettez apparaîtront ici.';

  @override
  String get finesPhotoBadge => 'Photo jointe';

  @override
  String get scanTitle => 'Valider une entrée';

  @override
  String get scanHint => 'Placez le QR code du conducteur dans le cadre.';

  @override
  String get scanManual => 'Saisir le code';

  @override
  String get scanManualTitle => 'Code d’entrée';

  @override
  String get scanManualHint =>
      'Le code s’affiche sous le QR code, dans l’application du conducteur.';

  @override
  String get scanValidate => 'Valider';

  @override
  String get scanChecking => 'Validation…';

  @override
  String get scanOk => 'Entrée validée';

  @override
  String scanOkDetail(String plate, int spot) {
    return '$plate · place n°$spot';
  }

  @override
  String get scanNotAutopark => 'Ce QR code n’est pas un code AutoPark.';

  @override
  String get scanPermission =>
      'Autorisez l’appareil photo pour scanner les QR codes.';

  @override
  String get scanCameraError =>
      'L’appareil photo est indisponible. Saisissez le code à la main.';

  @override
  String get scanAgain => 'Scanner un autre code';

  @override
  String get scanTorch => 'Lampe torche';

  @override
  String get scanFailed => 'Entrée refusée';

  @override
  String get bookingSlotHint =>
      'Choisissez d’abord votre horaire : seules les places libres sur ce créneau vous seront proposées.';

  @override
  String bookingForSlot(String range) {
    return 'Créneau : $range';
  }

  @override
  String get bookingSlotFull => 'Complet sur ce créneau';

  @override
  String get bookingSlotFullHint =>
      'Toutes les places sont réservées entre ces heures. Essayez un autre horaire.';

  @override
  String get bookingChangeSlot => 'Changer le créneau';

  @override
  String get bookingSpotsLoadError =>
      'Impossible de charger les places pour ce créneau';

  @override
  String bookingSpotTaken(int spot) {
    return 'La place n°$spot n’est plus libre sur ce créneau. Choisissez-en une autre.';
  }

  @override
  String get securityTitle => 'Sécurité';

  @override
  String get securitySubtitle => 'Mot de passe et appareils connectés';

  @override
  String get securityIntro =>
      'Changer votre mot de passe déconnecte vos autres appareils.';

  @override
  String get securityCurrent => 'Mot de passe actuel';

  @override
  String get securityNew => 'Nouveau mot de passe';

  @override
  String get securityNewHint => 'Au moins 8 caractères.';

  @override
  String get securityConfirm => 'Confirmer le nouveau mot de passe';

  @override
  String get securitySubmit => 'Changer le mot de passe';

  @override
  String get securityChanged =>
      'Mot de passe modifié. Vos autres appareils ont été déconnectés.';

  @override
  String get securityErrCurrent => 'Saisissez votre mot de passe actuel.';

  @override
  String get securityErrLength => 'Au moins 8 caractères.';

  @override
  String get securityErrSame =>
      'Choisissez un mot de passe différent de l’actuel.';

  @override
  String get securityErrConfirm =>
      'Les deux mots de passe ne correspondent pas.';

  @override
  String get securityEverywhere => 'Appareils connectés';

  @override
  String get securityEverywhereHint =>
      'Téléphone perdu ? Mettez fin à toutes vos sessions, y compris celle-ci.';

  @override
  String get securityEverywhereConfirmTitle =>
      'Déconnecter tous les appareils ?';

  @override
  String get securityEverywhereConfirmBody =>
      'Vous devrez vous reconnecter sur chacun de vos appareils, y compris celui-ci.';

  @override
  String get securityEverywhereConfirm => 'Tout déconnecter';
}
