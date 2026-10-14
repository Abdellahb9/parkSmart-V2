import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('fr')
  ];

  /// No description provided for @appName.
  ///
  /// In fr, this message translates to:
  /// **'AutoPark'**
  String get appName;

  /// No description provided for @city.
  ///
  /// In fr, this message translates to:
  /// **'Laâyoune'**
  String get city;

  /// No description provided for @amountMad.
  ///
  /// In fr, this message translates to:
  /// **'{amount} MAD'**
  String amountMad(String amount);

  /// No description provided for @spotNumber.
  ///
  /// In fr, this message translates to:
  /// **'Place n°{n}'**
  String spotNumber(int n);

  /// No description provided for @spotAndPlate.
  ///
  /// In fr, this message translates to:
  /// **'Place n°{spot} · {plate}'**
  String spotAndPlate(int spot, String plate);

  /// No description provided for @hoursShort.
  ///
  /// In fr, this message translates to:
  /// **'{n} h'**
  String hoursShort(int n);

  /// No description provided for @commonRetry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get commonRetry;

  /// No description provided for @commonLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger les données'**
  String get commonLoadError;

  /// No description provided for @commonNoData.
  ///
  /// In fr, this message translates to:
  /// **'Aucune donnée'**
  String get commonNoData;

  /// No description provided for @commonBack.
  ///
  /// In fr, this message translates to:
  /// **'Retour'**
  String get commonBack;

  /// No description provided for @commonCancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get commonCancel;

  /// No description provided for @commonClear.
  ///
  /// In fr, this message translates to:
  /// **'Effacer'**
  String get commonClear;

  /// No description provided for @commonContinue.
  ///
  /// In fr, this message translates to:
  /// **'Continuer'**
  String get commonContinue;

  /// No description provided for @commonSend.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer'**
  String get commonSend;

  /// No description provided for @commonFree.
  ///
  /// In fr, this message translates to:
  /// **'Libre'**
  String get commonFree;

  /// No description provided for @commonOccupied.
  ///
  /// In fr, this message translates to:
  /// **'Occupée'**
  String get commonOccupied;

  /// No description provided for @errTimeout.
  ///
  /// In fr, this message translates to:
  /// **'Le serveur met trop de temps à répondre. Réessayez.'**
  String get errTimeout;

  /// No description provided for @errNetwork.
  ///
  /// In fr, this message translates to:
  /// **'Serveur injoignable. Vérifiez votre connexion.'**
  String get errNetwork;

  /// No description provided for @errInvalidResponse.
  ///
  /// In fr, this message translates to:
  /// **'Réponse invalide du serveur.'**
  String get errInvalidResponse;

  /// No description provided for @errGeneric.
  ///
  /// In fr, this message translates to:
  /// **'Une erreur est survenue ({code}).'**
  String errGeneric(int code);

  /// No description provided for @navMap.
  ///
  /// In fr, this message translates to:
  /// **'Carte'**
  String get navMap;

  /// No description provided for @navReservations.
  ///
  /// In fr, this message translates to:
  /// **'Réservations'**
  String get navReservations;

  /// No description provided for @navComplaints.
  ///
  /// In fr, this message translates to:
  /// **'Réclamations'**
  String get navComplaints;

  /// No description provided for @navProfile.
  ///
  /// In fr, this message translates to:
  /// **'Profil'**
  String get navProfile;

  /// No description provided for @navStreets.
  ///
  /// In fr, this message translates to:
  /// **'Voies'**
  String get navStreets;

  /// No description provided for @navScan.
  ///
  /// In fr, this message translates to:
  /// **'Scanner'**
  String get navScan;

  /// No description provided for @navFines.
  ///
  /// In fr, this message translates to:
  /// **'Amendes'**
  String get navFines;

  /// No description provided for @notFoundTitle.
  ///
  /// In fr, this message translates to:
  /// **'Page introuvable'**
  String get notFoundTitle;

  /// No description provided for @notFoundBack.
  ///
  /// In fr, this message translates to:
  /// **'Retour à la carte'**
  String get notFoundBack;

  /// No description provided for @onbSkip.
  ///
  /// In fr, this message translates to:
  /// **'Passer'**
  String get onbSkip;

  /// No description provided for @onbNext.
  ///
  /// In fr, this message translates to:
  /// **'Suivant'**
  String get onbNext;

  /// No description provided for @onbStart.
  ///
  /// In fr, this message translates to:
  /// **'Commencer'**
  String get onbStart;

  /// No description provided for @onb1Title.
  ///
  /// In fr, this message translates to:
  /// **'Trouvez une place'**
  String get onb1Title;

  /// No description provided for @onb1Body.
  ///
  /// In fr, this message translates to:
  /// **'Toutes les places de Laâyoune sur une carte : parkings privés en bleu, voie publique en doré.'**
  String get onb1Body;

  /// No description provided for @onb2Title.
  ///
  /// In fr, this message translates to:
  /// **'Réservez en quelques secondes'**
  String get onb2Title;

  /// No description provided for @onb2Body.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez votre place, votre créneau, et confirmez. Le prix est calculé à l’heure entamée.'**
  String get onb2Body;

  /// No description provided for @onb3Title.
  ///
  /// In fr, this message translates to:
  /// **'Gagnez des récompenses'**
  String get onb3Title;

  /// No description provided for @onb3Body.
  ///
  /// In fr, this message translates to:
  /// **'Chaque séjour terminé compte : réservation gratuite, lavage, bons d’achat chez nos partenaires.'**
  String get onb3Body;

  /// No description provided for @loginTitle.
  ///
  /// In fr, this message translates to:
  /// **'Bon retour'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Connectez-vous pour réserver votre place.'**
  String get loginSubtitle;

  /// No description provided for @fieldEmail.
  ///
  /// In fr, this message translates to:
  /// **'Email'**
  String get fieldEmail;

  /// No description provided for @fieldPassword.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get fieldPassword;

  /// No description provided for @fieldFullName.
  ///
  /// In fr, this message translates to:
  /// **'Nom complet'**
  String get fieldFullName;

  /// No description provided for @fieldPhone.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get fieldPhone;

  /// No description provided for @emailHint.
  ///
  /// In fr, this message translates to:
  /// **'vous@exemple.ma'**
  String get emailHint;

  /// No description provided for @emailRequired.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre email.'**
  String get emailRequired;

  /// No description provided for @emailInvalid.
  ///
  /// In fr, this message translates to:
  /// **'Email invalide.'**
  String get emailInvalid;

  /// No description provided for @passwordMin.
  ///
  /// In fr, this message translates to:
  /// **'Au moins 6 caractères.'**
  String get passwordMin;

  /// No description provided for @passwordHelper.
  ///
  /// In fr, this message translates to:
  /// **'Au moins 6 caractères'**
  String get passwordHelper;

  /// No description provided for @showPassword.
  ///
  /// In fr, this message translates to:
  /// **'Afficher le mot de passe'**
  String get showPassword;

  /// No description provided for @hidePassword.
  ///
  /// In fr, this message translates to:
  /// **'Masquer le mot de passe'**
  String get hidePassword;

  /// No description provided for @loginSubmit.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get loginSubmit;

  /// No description provided for @loginCreateAccount.
  ///
  /// In fr, this message translates to:
  /// **'Créer un compte'**
  String get loginCreateAccount;

  /// No description provided for @registerTitle.
  ///
  /// In fr, this message translates to:
  /// **'Créer un compte'**
  String get registerTitle;

  /// No description provided for @registerWelcome.
  ///
  /// In fr, this message translates to:
  /// **'Bienvenue'**
  String get registerWelcome;

  /// No description provided for @registerSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Quelques informations et vous pourrez réserver.'**
  String get registerSubtitle;

  /// No description provided for @nameRequired.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre nom.'**
  String get nameRequired;

  /// No description provided for @registerSubmit.
  ///
  /// In fr, this message translates to:
  /// **'Créer mon compte'**
  String get registerSubmit;

  /// No description provided for @registerHaveAccount.
  ///
  /// In fr, this message translates to:
  /// **'J’ai déjà un compte'**
  String get registerHaveAccount;

  /// No description provided for @mapLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger la carte'**
  String get mapLoadError;

  /// No description provided for @mapSearchHint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher un parking…'**
  String get mapSearchHint;

  /// No description provided for @mapFreeOf.
  ///
  /// In fr, this message translates to:
  /// **'{free} / {total} libres'**
  String mapFreeOf(int free, int total);

  /// No description provided for @mapFilterAll.
  ///
  /// In fr, this message translates to:
  /// **'Tous'**
  String get mapFilterAll;

  /// No description provided for @mapFilterParkings.
  ///
  /// In fr, this message translates to:
  /// **'Parkings'**
  String get mapFilterParkings;

  /// No description provided for @mapFilterStreet.
  ///
  /// In fr, this message translates to:
  /// **'Voie publique'**
  String get mapFilterStreet;

  /// No description provided for @mapFilterAvailable.
  ///
  /// In fr, this message translates to:
  /// **'Disponibles'**
  String get mapFilterAvailable;

  /// No description provided for @mapNoMatch.
  ///
  /// In fr, this message translates to:
  /// **'Aucun parking ne correspond'**
  String get mapNoMatch;

  /// No description provided for @mapNoMatchHint.
  ///
  /// In fr, this message translates to:
  /// **'Modifiez la recherche ou les filtres.'**
  String get mapNoMatchHint;

  /// No description provided for @mapRefresh.
  ///
  /// In fr, this message translates to:
  /// **'Actualiser'**
  String get mapRefresh;

  /// No description provided for @mapLocate.
  ///
  /// In fr, this message translates to:
  /// **'Ma position'**
  String get mapLocate;

  /// No description provided for @mapLive.
  ///
  /// In fr, this message translates to:
  /// **'Temps réel'**
  String get mapLive;

  /// No description provided for @mapMarkerSemantics.
  ///
  /// In fr, this message translates to:
  /// **'{name}, {free} places libres sur {total}'**
  String mapMarkerSemantics(String name, int free, int total);

  /// No description provided for @locationDisabled.
  ///
  /// In fr, this message translates to:
  /// **'Activez la localisation sur votre appareil.'**
  String get locationDisabled;

  /// No description provided for @locationDenied.
  ///
  /// In fr, this message translates to:
  /// **'Autorisation de localisation refusée.'**
  String get locationDenied;

  /// No description provided for @locationBlocked.
  ///
  /// In fr, this message translates to:
  /// **'Autorisation bloquée. Activez-la dans les réglages.'**
  String get locationBlocked;

  /// No description provided for @parkingTypeNormal.
  ///
  /// In fr, this message translates to:
  /// **'Parking normal'**
  String get parkingTypeNormal;

  /// No description provided for @parkingTypeNormalShort.
  ///
  /// In fr, this message translates to:
  /// **'Normal'**
  String get parkingTypeNormalShort;

  /// No description provided for @parkingTypeStreet.
  ///
  /// In fr, this message translates to:
  /// **'Voie publique'**
  String get parkingTypeStreet;

  /// No description provided for @sheetFreeSpots.
  ///
  /// In fr, this message translates to:
  /// **'Places libres'**
  String get sheetFreeSpots;

  /// No description provided for @sheetHourly.
  ///
  /// In fr, this message translates to:
  /// **'Tarif horaire'**
  String get sheetHourly;

  /// No description provided for @sheetManagedBy.
  ///
  /// In fr, this message translates to:
  /// **'Géré par {owner}'**
  String sheetManagedBy(String owner);

  /// No description provided for @sheetReserve.
  ///
  /// In fr, this message translates to:
  /// **'Réserver une place'**
  String get sheetReserve;

  /// No description provided for @sheetFull.
  ///
  /// In fr, this message translates to:
  /// **'Complet'**
  String get sheetFull;

  /// No description provided for @bookingTitle.
  ///
  /// In fr, this message translates to:
  /// **'Réservation'**
  String get bookingTitle;

  /// No description provided for @bookingStepSpot.
  ///
  /// In fr, this message translates to:
  /// **'Place'**
  String get bookingStepSpot;

  /// No description provided for @bookingStepDetails.
  ///
  /// In fr, this message translates to:
  /// **'Créneau'**
  String get bookingStepDetails;

  /// No description provided for @bookingStepSummary.
  ///
  /// In fr, this message translates to:
  /// **'Récapitulatif'**
  String get bookingStepSummary;

  /// No description provided for @bookingLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger ce parking'**
  String get bookingLoadError;

  /// No description provided for @bookingRangeOrder.
  ///
  /// In fr, this message translates to:
  /// **'La fin doit être après le début.'**
  String get bookingRangeOrder;

  /// No description provided for @bookingRangeMax.
  ///
  /// In fr, this message translates to:
  /// **'Durée maximale : 24 heures.'**
  String get bookingRangeMax;

  /// No description provided for @bookingRangePast.
  ///
  /// In fr, this message translates to:
  /// **'Le début ne peut pas être dans le passé.'**
  String get bookingRangePast;

  /// No description provided for @bookingConfirmed.
  ///
  /// In fr, this message translates to:
  /// **'Réservation confirmée'**
  String get bookingConfirmed;

  /// No description provided for @bookingConfirmedDetail.
  ///
  /// In fr, this message translates to:
  /// **'Place n°{spot} — {hours} h pour {amount}'**
  String bookingConfirmedDetail(int spot, int hours, String amount);

  /// No description provided for @bookingSeeReservations.
  ///
  /// In fr, this message translates to:
  /// **'Voir mes réservations'**
  String get bookingSeeReservations;

  /// No description provided for @bookingConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer la réservation'**
  String get bookingConfirm;

  /// No description provided for @bookingNoSpots.
  ///
  /// In fr, this message translates to:
  /// **'Aucune place déclarée'**
  String get bookingNoSpots;

  /// No description provided for @bookingNoSpotsHint.
  ///
  /// In fr, this message translates to:
  /// **'Ce parking n’a pas encore de places configurées.'**
  String get bookingNoSpotsHint;

  /// No description provided for @bookingSelectSpot.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez une place'**
  String get bookingSelectSpot;

  /// No description provided for @bookingFreeOf.
  ///
  /// In fr, this message translates to:
  /// **'{free, plural, one{{free} place libre sur {total}} other{{free} places libres sur {total}}}'**
  String bookingFreeOf(int free, int total);

  /// No description provided for @legendReserved.
  ///
  /// In fr, this message translates to:
  /// **'Réservée'**
  String get legendReserved;

  /// No description provided for @spotStateFree.
  ///
  /// In fr, this message translates to:
  /// **'libre'**
  String get spotStateFree;

  /// No description provided for @spotStateReserved.
  ///
  /// In fr, this message translates to:
  /// **'réservée'**
  String get spotStateReserved;

  /// No description provided for @spotStateOccupied.
  ///
  /// In fr, this message translates to:
  /// **'occupée'**
  String get spotStateOccupied;

  /// No description provided for @spotStateUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'indisponible'**
  String get spotStateUnavailable;

  /// No description provided for @spotSemantics.
  ///
  /// In fr, this message translates to:
  /// **'Place {n}, {state}'**
  String spotSemantics(int n, String state);

  /// No description provided for @bookingVehicle.
  ///
  /// In fr, this message translates to:
  /// **'Votre véhicule'**
  String get bookingVehicle;

  /// No description provided for @fieldPlate.
  ///
  /// In fr, this message translates to:
  /// **'Plaque d’immatriculation'**
  String get fieldPlate;

  /// No description provided for @plateHint.
  ///
  /// In fr, this message translates to:
  /// **'12345-A-61'**
  String get plateHint;

  /// No description provided for @plateRequired.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre plaque.'**
  String get plateRequired;

  /// No description provided for @bookingSlot.
  ///
  /// In fr, this message translates to:
  /// **'Créneau'**
  String get bookingSlot;

  /// No description provided for @bookingStart.
  ///
  /// In fr, this message translates to:
  /// **'Début'**
  String get bookingStart;

  /// No description provided for @bookingEnd.
  ///
  /// In fr, this message translates to:
  /// **'Fin'**
  String get bookingEnd;

  /// No description provided for @bookingBilled.
  ///
  /// In fr, this message translates to:
  /// **'Durée facturée'**
  String get bookingBilled;

  /// No description provided for @bookingEstimate.
  ///
  /// In fr, this message translates to:
  /// **'Estimation'**
  String get bookingEstimate;

  /// No description provided for @bookingPriceNote.
  ///
  /// In fr, this message translates to:
  /// **'Toute heure entamée est due. Le montant final est calculé par le serveur.'**
  String get bookingPriceNote;

  /// No description provided for @bookingPlate.
  ///
  /// In fr, this message translates to:
  /// **'Plaque'**
  String get bookingPlate;

  /// No description provided for @bookingTotal.
  ///
  /// In fr, this message translates to:
  /// **'Total estimé'**
  String get bookingTotal;

  /// No description provided for @bookingCancelNote.
  ///
  /// In fr, this message translates to:
  /// **'Annulation possible, avec des frais de 20 % une fois la réservation active.'**
  String get bookingCancelNote;

  /// No description provided for @resTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mes réservations'**
  String get resTitle;

  /// No description provided for @resEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune réservation'**
  String get resEmpty;

  /// No description provided for @resEmptyHint.
  ///
  /// In fr, this message translates to:
  /// **'Vos réservations apparaîtront ici.'**
  String get resEmptyHint;

  /// No description provided for @resHistory.
  ///
  /// In fr, this message translates to:
  /// **'Historique'**
  String get resHistory;

  /// No description provided for @resNoPast.
  ///
  /// In fr, this message translates to:
  /// **'Aucune réservation passée pour le moment.'**
  String get resNoPast;

  /// No description provided for @resCancelTitle.
  ///
  /// In fr, this message translates to:
  /// **'Annuler la réservation ?'**
  String get resCancelTitle;

  /// No description provided for @resCancelBody.
  ///
  /// In fr, this message translates to:
  /// **'Des frais d’annulation de 20 % seront appliqués, soit environ {amount}.'**
  String resCancelBody(String amount);

  /// No description provided for @resCancelConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Annuler la réservation'**
  String get resCancelConfirm;

  /// No description provided for @resCancelled.
  ///
  /// In fr, this message translates to:
  /// **'Réservation annulée · frais de {amount}'**
  String resCancelled(String amount);

  /// No description provided for @resPaid.
  ///
  /// In fr, this message translates to:
  /// **'Paiement accepté · {amount}'**
  String resPaid(String amount);

  /// No description provided for @resPayOnSite.
  ///
  /// In fr, this message translates to:
  /// **'À régler au gardien à votre arrivée.'**
  String get resPayOnSite;

  /// No description provided for @resNoCode.
  ///
  /// In fr, this message translates to:
  /// **'Aucun code d’entrée pour cette réservation.'**
  String get resNoCode;

  /// No description provided for @resExtended.
  ///
  /// In fr, this message translates to:
  /// **'Réservation prolongée jusqu’à {time} · {amount}'**
  String resExtended(String time, String amount);

  /// No description provided for @resNoPosition.
  ///
  /// In fr, this message translates to:
  /// **'Position du parking indisponible.'**
  String get resNoPosition;

  /// No description provided for @resNavFailed.
  ///
  /// In fr, this message translates to:
  /// **'Impossible d’ouvrir la navigation.'**
  String get resNavFailed;

  /// No description provided for @resOverstay.
  ///
  /// In fr, this message translates to:
  /// **'Dépassement'**
  String get resOverstay;

  /// No description provided for @resInProgress.
  ///
  /// In fr, this message translates to:
  /// **'En cours'**
  String get resInProgress;

  /// No description provided for @resOverstayOf.
  ///
  /// In fr, this message translates to:
  /// **'Dépassement de {time}'**
  String resOverstayOf(String time);

  /// No description provided for @resRemainingOf.
  ///
  /// In fr, this message translates to:
  /// **'Temps restant {time}'**
  String resRemainingOf(String time);

  /// No description provided for @resBeyond.
  ///
  /// In fr, this message translates to:
  /// **'au-delà du créneau'**
  String get resBeyond;

  /// No description provided for @resLeft.
  ///
  /// In fr, this message translates to:
  /// **'restant'**
  String get resLeft;

  /// No description provided for @resOverstayWarning.
  ///
  /// In fr, this message translates to:
  /// **'Votre créneau est dépassé : un technicien peut émettre une amende.'**
  String get resOverstayWarning;

  /// No description provided for @resEntryCode.
  ///
  /// In fr, this message translates to:
  /// **'Code d’entrée'**
  String get resEntryCode;

  /// No description provided for @resExtend.
  ///
  /// In fr, this message translates to:
  /// **'Prolonger'**
  String get resExtend;

  /// No description provided for @resGo.
  ///
  /// In fr, this message translates to:
  /// **'Y aller'**
  String get resGo;

  /// No description provided for @resPay.
  ///
  /// In fr, this message translates to:
  /// **'Payer'**
  String get resPay;

  /// No description provided for @resAwaitCash.
  ///
  /// In fr, this message translates to:
  /// **'À régler au gardien · {amount}'**
  String resAwaitCash(String amount);

  /// No description provided for @resUnpaid.
  ///
  /// In fr, this message translates to:
  /// **'Non payé · {amount}'**
  String resUnpaid(String amount);

  /// No description provided for @resPastLine.
  ///
  /// In fr, this message translates to:
  /// **'Place n°{spot} · {hours} h · {amount}'**
  String resPastLine(int spot, int hours, String amount);

  /// No description provided for @qrHint.
  ///
  /// In fr, this message translates to:
  /// **'Présentez ce code à l’entrée pour valider votre arrivée.'**
  String get qrHint;

  /// No description provided for @extendTitle.
  ///
  /// In fr, this message translates to:
  /// **'Prolonger la réservation'**
  String get extendTitle;

  /// No description provided for @extendChoose.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez la durée supplémentaire.'**
  String get extendChoose;

  /// No description provided for @extendCurrentEnd.
  ///
  /// In fr, this message translates to:
  /// **'Fin actuelle : {time}'**
  String extendCurrentEnd(String time);

  /// No description provided for @extendUntil.
  ///
  /// In fr, this message translates to:
  /// **'Jusqu’à {time}'**
  String extendUntil(String time);

  /// No description provided for @extendApprox.
  ///
  /// In fr, this message translates to:
  /// **' · environ {amount}'**
  String extendApprox(String amount);

  /// No description provided for @extendTooLong.
  ///
  /// In fr, this message translates to:
  /// **'Dépasse la limite de 24 h'**
  String get extendTooLong;

  /// No description provided for @extendServerNote.
  ///
  /// In fr, this message translates to:
  /// **'Le montant exact est calculé par le serveur.'**
  String get extendServerNote;

  /// No description provided for @duration30m.
  ///
  /// In fr, this message translates to:
  /// **'30 minutes'**
  String get duration30m;

  /// No description provided for @duration1h.
  ///
  /// In fr, this message translates to:
  /// **'1 heure'**
  String get duration1h;

  /// No description provided for @duration2h.
  ///
  /// In fr, this message translates to:
  /// **'2 heures'**
  String get duration2h;

  /// No description provided for @duration3h.
  ///
  /// In fr, this message translates to:
  /// **'3 heures'**
  String get duration3h;

  /// No description provided for @statusDone.
  ///
  /// In fr, this message translates to:
  /// **'Terminée'**
  String get statusDone;

  /// No description provided for @statusCancelled.
  ///
  /// In fr, this message translates to:
  /// **'Annulée'**
  String get statusCancelled;

  /// No description provided for @statusPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get statusPending;

  /// No description provided for @cmpTitle.
  ///
  /// In fr, this message translates to:
  /// **'Réclamations'**
  String get cmpTitle;

  /// No description provided for @cmpSent.
  ///
  /// In fr, this message translates to:
  /// **'Réclamation envoyée'**
  String get cmpSent;

  /// No description provided for @cmpReport.
  ///
  /// In fr, this message translates to:
  /// **'Signaler un problème'**
  String get cmpReport;

  /// No description provided for @cmpParking.
  ///
  /// In fr, this message translates to:
  /// **'Parking concerné'**
  String get cmpParking;

  /// No description provided for @cmpChooseParking.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez un parking.'**
  String get cmpChooseParking;

  /// No description provided for @cmpMessage.
  ///
  /// In fr, this message translates to:
  /// **'Votre message'**
  String get cmpMessage;

  /// No description provided for @cmpMessageHint.
  ///
  /// In fr, this message translates to:
  /// **'Décrivez le problème rencontré…'**
  String get cmpMessageHint;

  /// No description provided for @cmpMessageMin.
  ///
  /// In fr, this message translates to:
  /// **'Au moins 10 caractères.'**
  String get cmpMessageMin;

  /// No description provided for @cmpMine.
  ///
  /// In fr, this message translates to:
  /// **'Mes réclamations'**
  String get cmpMine;

  /// No description provided for @cmpNone.
  ///
  /// In fr, this message translates to:
  /// **'Aucune réclamation envoyée.'**
  String get cmpNone;

  /// No description provided for @cmpResolved.
  ///
  /// In fr, this message translates to:
  /// **'Résolue'**
  String get cmpResolved;

  /// No description provided for @cmpOpen.
  ///
  /// In fr, this message translates to:
  /// **'En cours'**
  String get cmpOpen;

  /// No description provided for @profileTitle.
  ///
  /// In fr, this message translates to:
  /// **'Profil'**
  String get profileTitle;

  /// No description provided for @profileWallet.
  ///
  /// In fr, this message translates to:
  /// **'Portefeuille'**
  String get profileWallet;

  /// No description provided for @profileLoyalty.
  ///
  /// In fr, this message translates to:
  /// **'Fidélité'**
  String get profileLoyalty;

  /// No description provided for @profileRewardsError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger vos récompenses'**
  String get profileRewardsError;

  /// No description provided for @profileNoPoints.
  ///
  /// In fr, this message translates to:
  /// **'Pas encore de points'**
  String get profileNoPoints;

  /// No description provided for @profileNoPointsHint.
  ///
  /// In fr, this message translates to:
  /// **'Vos points s’accumulent à chaque séjour terminé.'**
  String get profileNoPointsHint;

  /// No description provided for @profileStays.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, one{{count} séjour} other{{count} séjours}}'**
  String profileStays(int count);

  /// No description provided for @profileRewards.
  ///
  /// In fr, this message translates to:
  /// **'Récompenses'**
  String get profileRewards;

  /// No description provided for @profileSettings.
  ///
  /// In fr, this message translates to:
  /// **'Réglages'**
  String get profileSettings;

  /// No description provided for @profileLogout.
  ///
  /// In fr, this message translates to:
  /// **'Déconnexion'**
  String get profileLogout;

  /// No description provided for @logoutTitle.
  ///
  /// In fr, this message translates to:
  /// **'Se déconnecter ?'**
  String get logoutTitle;

  /// No description provided for @logoutBody.
  ///
  /// In fr, this message translates to:
  /// **'Vous devrez saisir à nouveau votre email et votre mot de passe.'**
  String get logoutBody;

  /// No description provided for @logoutStay.
  ///
  /// In fr, this message translates to:
  /// **'Rester connecté'**
  String get logoutStay;

  /// No description provided for @logoutConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Se déconnecter'**
  String get logoutConfirm;

  /// No description provided for @walletBalance.
  ///
  /// In fr, this message translates to:
  /// **'Solde'**
  String get walletBalance;

  /// No description provided for @walletUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'Indisponible'**
  String get walletUnavailable;

  /// No description provided for @rewardProgress.
  ///
  /// In fr, this message translates to:
  /// **'{current} / {required} séjours'**
  String rewardProgress(int current, int required);

  /// No description provided for @themeTitle.
  ///
  /// In fr, this message translates to:
  /// **'Thème'**
  String get themeTitle;

  /// No description provided for @themeLight.
  ///
  /// In fr, this message translates to:
  /// **'Clair'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In fr, this message translates to:
  /// **'Sombre'**
  String get themeDark;

  /// No description provided for @themeSystem.
  ///
  /// In fr, this message translates to:
  /// **'Système'**
  String get themeSystem;

  /// No description provided for @languageTitle.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get languageTitle;

  /// No description provided for @languageFrench.
  ///
  /// In fr, this message translates to:
  /// **'Français'**
  String get languageFrench;

  /// No description provided for @languageArabic.
  ///
  /// In fr, this message translates to:
  /// **'العربية'**
  String get languageArabic;

  /// No description provided for @notificationsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @comingSoon.
  ///
  /// In fr, this message translates to:
  /// **'Bientôt disponible'**
  String get comingSoon;

  /// No description provided for @roleTechnician.
  ///
  /// In fr, this message translates to:
  /// **'Technicien'**
  String get roleTechnician;

  /// No description provided for @walletTitle.
  ///
  /// In fr, this message translates to:
  /// **'Portefeuille'**
  String get walletTitle;

  /// No description provided for @walletLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger votre portefeuille'**
  String get walletLoadError;

  /// No description provided for @walletHistory.
  ///
  /// In fr, this message translates to:
  /// **'Historique'**
  String get walletHistory;

  /// No description provided for @walletEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucun mouvement pour le moment.'**
  String get walletEmpty;

  /// No description provided for @walletAvailable.
  ///
  /// In fr, this message translates to:
  /// **'Solde disponible'**
  String get walletAvailable;

  /// No description provided for @walletTopUp.
  ///
  /// In fr, this message translates to:
  /// **'Recharger'**
  String get walletTopUp;

  /// No description provided for @walletToppedUp.
  ///
  /// In fr, this message translates to:
  /// **'Portefeuille rechargé de {amount}'**
  String walletToppedUp(String amount);

  /// No description provided for @walletTopUpRefused.
  ///
  /// In fr, this message translates to:
  /// **'Recharge refusée.'**
  String get walletTopUpRefused;

  /// No description provided for @walletTopUpTitle.
  ///
  /// In fr, this message translates to:
  /// **'Recharger le portefeuille'**
  String get walletTopUpTitle;

  /// No description provided for @walletTopUpHint.
  ///
  /// In fr, this message translates to:
  /// **'Le montant est débité de votre carte bancaire.'**
  String get walletTopUpHint;

  /// No description provided for @walletOtherAmount.
  ///
  /// In fr, this message translates to:
  /// **'Autre montant'**
  String get walletOtherAmount;

  /// No description provided for @walletAmountHint.
  ///
  /// In fr, this message translates to:
  /// **'ex. 75'**
  String get walletAmountHint;

  /// No description provided for @walletLimits.
  ///
  /// In fr, this message translates to:
  /// **'Entre 1 et 5000 MAD.'**
  String get walletLimits;

  /// No description provided for @walletChoose.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez un montant'**
  String get walletChoose;

  /// No description provided for @payStatusPaid.
  ///
  /// In fr, this message translates to:
  /// **'Payé'**
  String get payStatusPaid;

  /// No description provided for @payStatusPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get payStatusPending;

  /// No description provided for @payStatusFailed.
  ///
  /// In fr, this message translates to:
  /// **'Échoué'**
  String get payStatusFailed;

  /// No description provided for @payStatusRefunded.
  ///
  /// In fr, this message translates to:
  /// **'Remboursé'**
  String get payStatusRefunded;

  /// No description provided for @payStatusCancelled.
  ///
  /// In fr, this message translates to:
  /// **'Annulé'**
  String get payStatusCancelled;

  /// No description provided for @paymentKindTopup.
  ///
  /// In fr, this message translates to:
  /// **'Recharge'**
  String get paymentKindTopup;

  /// No description provided for @paymentKindRefund.
  ///
  /// In fr, this message translates to:
  /// **'Remboursement'**
  String get paymentKindRefund;

  /// No description provided for @paymentKindBooking.
  ///
  /// In fr, this message translates to:
  /// **'Stationnement'**
  String get paymentKindBooking;

  /// No description provided for @methodWallet.
  ///
  /// In fr, this message translates to:
  /// **'Portefeuille'**
  String get methodWallet;

  /// No description provided for @methodCard.
  ///
  /// In fr, this message translates to:
  /// **'Carte bancaire'**
  String get methodCard;

  /// No description provided for @methodCash.
  ///
  /// In fr, this message translates to:
  /// **'Espèces sur place'**
  String get methodCash;

  /// No description provided for @payTitle.
  ///
  /// In fr, this message translates to:
  /// **'Paiement'**
  String get payTitle;

  /// No description provided for @payDetail.
  ///
  /// In fr, this message translates to:
  /// **'Place n°{spot} · {hours} h'**
  String payDetail(int spot, int hours);

  /// No description provided for @payTotal.
  ///
  /// In fr, this message translates to:
  /// **'Total à payer'**
  String get payTotal;

  /// No description provided for @payReadingBalance.
  ///
  /// In fr, this message translates to:
  /// **'Lecture du solde…'**
  String get payReadingBalance;

  /// No description provided for @payBalanceUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'Solde indisponible'**
  String get payBalanceUnavailable;

  /// No description provided for @payBalance.
  ///
  /// In fr, this message translates to:
  /// **'Solde {amount}'**
  String payBalance(String amount);

  /// No description provided for @payBalanceLow.
  ///
  /// In fr, this message translates to:
  /// **'Solde insuffisant ({amount})'**
  String payBalanceLow(String amount);

  /// No description provided for @payCardSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Débit immédiat'**
  String get payCardSubtitle;

  /// No description provided for @payCashSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'À régler au gardien à l’entrée'**
  String get payCashSubtitle;

  /// No description provided for @payOnSite.
  ///
  /// In fr, this message translates to:
  /// **'Payer sur place'**
  String get payOnSite;

  /// No description provided for @payAmount.
  ///
  /// In fr, this message translates to:
  /// **'Payer {amount}'**
  String payAmount(String amount);

  /// No description provided for @payRefused.
  ///
  /// In fr, this message translates to:
  /// **'Paiement refusé. Essayez un autre moyen.'**
  String get payRefused;

  /// No description provided for @streetsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Voie publique'**
  String get streetsTitle;

  /// No description provided for @streetsEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune voie publique'**
  String get streetsEmpty;

  /// No description provided for @streetsEmptyHint.
  ///
  /// In fr, this message translates to:
  /// **'Aucun stationnement sur voie publique n’est déclaré.'**
  String get streetsEmptyHint;

  /// No description provided for @streetsSearch.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher une voie…'**
  String get streetsSearch;

  /// No description provided for @streetsNoResult.
  ///
  /// In fr, this message translates to:
  /// **'Aucun résultat pour « {query} ».'**
  String streetsNoResult(String query);

  /// No description provided for @streetsStats.
  ///
  /// In fr, this message translates to:
  /// **'{free} libres · {occupied} occupées sur {total}'**
  String streetsStats(int free, int occupied, int total);

  /// No description provided for @spotFreeTitle.
  ///
  /// In fr, this message translates to:
  /// **'Place libre'**
  String get spotFreeTitle;

  /// No description provided for @spotOverstaySince.
  ///
  /// In fr, this message translates to:
  /// **'Dépassement depuis {time}'**
  String spotOverstaySince(String time);

  /// No description provided for @spotUntil.
  ///
  /// In fr, this message translates to:
  /// **'Jusqu’à {time}'**
  String spotUntil(String time);

  /// No description provided for @badgeFine.
  ///
  /// In fr, this message translates to:
  /// **'Amende'**
  String get badgeFine;

  /// No description provided for @fineTitle.
  ///
  /// In fr, this message translates to:
  /// **'Émettre une amende'**
  String get fineTitle;

  /// No description provided for @fineSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'{street} · place n°{spot}'**
  String fineSubtitle(String street, int spot);

  /// No description provided for @finePlate.
  ///
  /// In fr, this message translates to:
  /// **'Plaque'**
  String get finePlate;

  /// No description provided for @finePlateRequired.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez la plaque.'**
  String get finePlateRequired;

  /// No description provided for @fineReason.
  ///
  /// In fr, this message translates to:
  /// **'Motif'**
  String get fineReason;

  /// No description provided for @fineReasonRequired.
  ///
  /// In fr, this message translates to:
  /// **'Précisez le motif.'**
  String get fineReasonRequired;

  /// No description provided for @fineSubmit.
  ///
  /// In fr, this message translates to:
  /// **'Émettre l’amende'**
  String get fineSubmit;

  /// No description provided for @fineReasonOverstay.
  ///
  /// In fr, this message translates to:
  /// **'Dépassement de la durée'**
  String get fineReasonOverstay;

  /// No description provided for @fineReasonNoBooking.
  ///
  /// In fr, this message translates to:
  /// **'Stationnement sans réservation'**
  String get fineReasonNoBooking;

  /// No description provided for @fineReasonObstruction.
  ///
  /// In fr, this message translates to:
  /// **'Stationnement gênant'**
  String get fineReasonObstruction;

  /// No description provided for @finePhoto.
  ///
  /// In fr, this message translates to:
  /// **'Photo de la plaque'**
  String get finePhoto;

  /// No description provided for @fineAddPhoto.
  ///
  /// In fr, this message translates to:
  /// **'Prendre une photo'**
  String get fineAddPhoto;

  /// No description provided for @fineRetakePhoto.
  ///
  /// In fr, this message translates to:
  /// **'Reprendre'**
  String get fineRetakePhoto;

  /// No description provided for @fineRemovePhoto.
  ///
  /// In fr, this message translates to:
  /// **'Retirer la photo'**
  String get fineRemovePhoto;

  /// No description provided for @finePhotoHint.
  ///
  /// In fr, this message translates to:
  /// **'Une photo de la plaque sert de preuve en cas de contestation.'**
  String get finePhotoHint;

  /// No description provided for @finePhotoFailed.
  ///
  /// In fr, this message translates to:
  /// **'Impossible d’ouvrir l’appareil photo.'**
  String get finePhotoFailed;

  /// No description provided for @fineIssued.
  ///
  /// In fr, this message translates to:
  /// **'Amende émise'**
  String get fineIssued;

  /// No description provided for @fineIssuedWithPhoto.
  ///
  /// In fr, this message translates to:
  /// **'Amende émise avec photo'**
  String get fineIssuedWithPhoto;

  /// No description provided for @finesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Amendes émises'**
  String get finesTitle;

  /// No description provided for @finesEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune amende émise'**
  String get finesEmpty;

  /// No description provided for @finesEmptyHint.
  ///
  /// In fr, this message translates to:
  /// **'Les amendes que vous émettez apparaîtront ici.'**
  String get finesEmptyHint;

  /// No description provided for @finesPhotoBadge.
  ///
  /// In fr, this message translates to:
  /// **'Photo jointe'**
  String get finesPhotoBadge;

  /// No description provided for @scanTitle.
  ///
  /// In fr, this message translates to:
  /// **'Valider une entrée'**
  String get scanTitle;

  /// No description provided for @scanHint.
  ///
  /// In fr, this message translates to:
  /// **'Placez le QR code du conducteur dans le cadre.'**
  String get scanHint;

  /// No description provided for @scanManual.
  ///
  /// In fr, this message translates to:
  /// **'Saisir le code'**
  String get scanManual;

  /// No description provided for @scanManualTitle.
  ///
  /// In fr, this message translates to:
  /// **'Code d’entrée'**
  String get scanManualTitle;

  /// No description provided for @scanManualHint.
  ///
  /// In fr, this message translates to:
  /// **'Le code s’affiche sous le QR code, dans l’application du conducteur.'**
  String get scanManualHint;

  /// No description provided for @scanValidate.
  ///
  /// In fr, this message translates to:
  /// **'Valider'**
  String get scanValidate;

  /// No description provided for @scanChecking.
  ///
  /// In fr, this message translates to:
  /// **'Validation…'**
  String get scanChecking;

  /// No description provided for @scanOk.
  ///
  /// In fr, this message translates to:
  /// **'Entrée validée'**
  String get scanOk;

  /// No description provided for @scanOkDetail.
  ///
  /// In fr, this message translates to:
  /// **'{plate} · place n°{spot}'**
  String scanOkDetail(String plate, int spot);

  /// No description provided for @scanNotAutopark.
  ///
  /// In fr, this message translates to:
  /// **'Ce QR code n’est pas un code AutoPark.'**
  String get scanNotAutopark;

  /// No description provided for @scanPermission.
  ///
  /// In fr, this message translates to:
  /// **'Autorisez l’appareil photo pour scanner les QR codes.'**
  String get scanPermission;

  /// No description provided for @scanCameraError.
  ///
  /// In fr, this message translates to:
  /// **'L’appareil photo est indisponible. Saisissez le code à la main.'**
  String get scanCameraError;

  /// No description provided for @scanAgain.
  ///
  /// In fr, this message translates to:
  /// **'Scanner un autre code'**
  String get scanAgain;

  /// No description provided for @scanTorch.
  ///
  /// In fr, this message translates to:
  /// **'Lampe torche'**
  String get scanTorch;

  /// No description provided for @scanFailed.
  ///
  /// In fr, this message translates to:
  /// **'Entrée refusée'**
  String get scanFailed;

  /// No description provided for @bookingSlotHint.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez d’abord votre horaire : seules les places libres sur ce créneau vous seront proposées.'**
  String get bookingSlotHint;

  /// No description provided for @bookingForSlot.
  ///
  /// In fr, this message translates to:
  /// **'Créneau : {range}'**
  String bookingForSlot(String range);

  /// No description provided for @bookingSlotFull.
  ///
  /// In fr, this message translates to:
  /// **'Complet sur ce créneau'**
  String get bookingSlotFull;

  /// No description provided for @bookingSlotFullHint.
  ///
  /// In fr, this message translates to:
  /// **'Toutes les places sont réservées entre ces heures. Essayez un autre horaire.'**
  String get bookingSlotFullHint;

  /// No description provided for @bookingChangeSlot.
  ///
  /// In fr, this message translates to:
  /// **'Changer le créneau'**
  String get bookingChangeSlot;

  /// No description provided for @bookingSpotsLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger les places pour ce créneau'**
  String get bookingSpotsLoadError;

  /// No description provided for @bookingSpotTaken.
  ///
  /// In fr, this message translates to:
  /// **'La place n°{spot} n’est plus libre sur ce créneau. Choisissez-en une autre.'**
  String bookingSpotTaken(int spot);

  /// No description provided for @securityTitle.
  ///
  /// In fr, this message translates to:
  /// **'Sécurité'**
  String get securityTitle;

  /// No description provided for @securitySubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe et appareils connectés'**
  String get securitySubtitle;

  /// No description provided for @securityIntro.
  ///
  /// In fr, this message translates to:
  /// **'Changer votre mot de passe déconnecte vos autres appareils.'**
  String get securityIntro;

  /// No description provided for @securityCurrent.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe actuel'**
  String get securityCurrent;

  /// No description provided for @securityNew.
  ///
  /// In fr, this message translates to:
  /// **'Nouveau mot de passe'**
  String get securityNew;

  /// No description provided for @securityNewHint.
  ///
  /// In fr, this message translates to:
  /// **'Au moins 8 caractères.'**
  String get securityNewHint;

  /// No description provided for @securityConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer le nouveau mot de passe'**
  String get securityConfirm;

  /// No description provided for @securitySubmit.
  ///
  /// In fr, this message translates to:
  /// **'Changer le mot de passe'**
  String get securitySubmit;

  /// No description provided for @securityChanged.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe modifié. Vos autres appareils ont été déconnectés.'**
  String get securityChanged;

  /// No description provided for @securityErrCurrent.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre mot de passe actuel.'**
  String get securityErrCurrent;

  /// No description provided for @securityErrLength.
  ///
  /// In fr, this message translates to:
  /// **'Au moins 8 caractères.'**
  String get securityErrLength;

  /// No description provided for @securityErrSame.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez un mot de passe différent de l’actuel.'**
  String get securityErrSame;

  /// No description provided for @securityErrConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Les deux mots de passe ne correspondent pas.'**
  String get securityErrConfirm;

  /// No description provided for @securityEverywhere.
  ///
  /// In fr, this message translates to:
  /// **'Appareils connectés'**
  String get securityEverywhere;

  /// No description provided for @securityEverywhereHint.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone perdu ? Mettez fin à toutes vos sessions, y compris celle-ci.'**
  String get securityEverywhereHint;

  /// No description provided for @securityEverywhereConfirmTitle.
  ///
  /// In fr, this message translates to:
  /// **'Déconnecter tous les appareils ?'**
  String get securityEverywhereConfirmTitle;

  /// No description provided for @securityEverywhereConfirmBody.
  ///
  /// In fr, this message translates to:
  /// **'Vous devrez vous reconnecter sur chacun de vos appareils, y compris celui-ci.'**
  String get securityEverywhereConfirmBody;

  /// No description provided for @securityEverywhereConfirm.
  ///
  /// In fr, this message translates to:
  /// **'Tout déconnecter'**
  String get securityEverywhereConfirm;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
