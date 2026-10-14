// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'AutoPark';

  @override
  String get city => 'العيون';

  @override
  String amountMad(String amount) {
    return '$amount د.م.';
  }

  @override
  String spotNumber(int n) {
    return 'المكان رقم $n';
  }

  @override
  String spotAndPlate(int spot, String plate) {
    return 'المكان رقم $spot · $plate';
  }

  @override
  String hoursShort(int n) {
    return '$n س';
  }

  @override
  String get commonRetry => 'إعادة المحاولة';

  @override
  String get commonLoadError => 'تعذّر تحميل البيانات';

  @override
  String get commonNoData => 'لا توجد بيانات';

  @override
  String get commonBack => 'رجوع';

  @override
  String get commonCancel => 'إلغاء';

  @override
  String get commonClear => 'مسح';

  @override
  String get commonContinue => 'متابعة';

  @override
  String get commonSend => 'إرسال';

  @override
  String get commonFree => 'شاغر';

  @override
  String get commonOccupied => 'مشغول';

  @override
  String get errTimeout => 'الخادم يتأخر في الرد. أعد المحاولة.';

  @override
  String get errNetwork => 'تعذّر الاتصال بالخادم. تحقق من اتصالك.';

  @override
  String get errInvalidResponse => 'استجابة غير صالحة من الخادم.';

  @override
  String errGeneric(int code) {
    return 'حدث خطأ ($code).';
  }

  @override
  String get navMap => 'الخريطة';

  @override
  String get navReservations => 'الحجوزات';

  @override
  String get navComplaints => 'الشكايات';

  @override
  String get navProfile => 'حسابي';

  @override
  String get navStreets => 'الشوارع';

  @override
  String get navScan => 'المسح';

  @override
  String get navFines => 'الغرامات';

  @override
  String get notFoundTitle => 'الصفحة غير موجودة';

  @override
  String get notFoundBack => 'العودة إلى الخريطة';

  @override
  String get onbSkip => 'تخطي';

  @override
  String get onbNext => 'التالي';

  @override
  String get onbStart => 'ابدأ';

  @override
  String get onb1Title => 'اعثر على مكان';

  @override
  String get onb1Body =>
      'جميع أماكن الركن في العيون على خريطة واحدة: المواقف الخاصة بالأزرق، والطريق العام بالذهبي.';

  @override
  String get onb2Title => 'احجز في ثوانٍ';

  @override
  String get onb2Body =>
      'اختر مكانك ووقتك ثم أكّد. يُحتسب الثمن عن كل ساعة بدأت.';

  @override
  String get onb3Title => 'اربح مكافآت';

  @override
  String get onb3Body =>
      'كل زيارة منتهية تُحتسب: حجز مجاني، غسل، وقسائم شراء لدى شركائنا.';

  @override
  String get loginTitle => 'مرحبًا بعودتك';

  @override
  String get loginSubtitle => 'سجّل الدخول لحجز مكانك.';

  @override
  String get fieldEmail => 'البريد الإلكتروني';

  @override
  String get fieldPassword => 'كلمة المرور';

  @override
  String get fieldFullName => 'الاسم الكامل';

  @override
  String get fieldPhone => 'الهاتف';

  @override
  String get emailHint => 'vous@exemple.ma';

  @override
  String get emailRequired => 'أدخل بريدك الإلكتروني.';

  @override
  String get emailInvalid => 'بريد إلكتروني غير صالح.';

  @override
  String get passwordMin => '6 أحرف على الأقل.';

  @override
  String get passwordHelper => '6 أحرف على الأقل';

  @override
  String get showPassword => 'إظهار كلمة المرور';

  @override
  String get hidePassword => 'إخفاء كلمة المرور';

  @override
  String get loginSubmit => 'دخول';

  @override
  String get loginCreateAccount => 'إنشاء حساب';

  @override
  String get registerTitle => 'إنشاء حساب';

  @override
  String get registerWelcome => 'مرحبًا';

  @override
  String get registerSubtitle => 'بعض المعلومات وستتمكن من الحجز.';

  @override
  String get nameRequired => 'أدخل اسمك.';

  @override
  String get registerSubmit => 'إنشاء حسابي';

  @override
  String get registerHaveAccount => 'لدي حساب بالفعل';

  @override
  String get mapLoadError => 'تعذّر تحميل الخريطة';

  @override
  String get mapSearchHint => 'ابحث عن موقف…';

  @override
  String mapFreeOf(int free, int total) {
    return '$free / $total شاغر';
  }

  @override
  String get mapFilterAll => 'الكل';

  @override
  String get mapFilterParkings => 'المواقف';

  @override
  String get mapFilterStreet => 'الطريق العام';

  @override
  String get mapFilterAvailable => 'المتاحة';

  @override
  String get mapNoMatch => 'لا يوجد موقف مطابق';

  @override
  String get mapNoMatchHint => 'غيّر البحث أو عوامل التصفية.';

  @override
  String get mapRefresh => 'تحديث';

  @override
  String get mapLocate => 'موقعي';

  @override
  String get mapLive => 'مباشر';

  @override
  String mapMarkerSemantics(String name, int free, int total) {
    return '$name، $free أماكن شاغرة من أصل $total';
  }

  @override
  String get locationDisabled => 'فعّل خدمة الموقع على جهازك.';

  @override
  String get locationDenied => 'تم رفض إذن الموقع.';

  @override
  String get locationBlocked => 'إذن الموقع محظور. فعّله من الإعدادات.';

  @override
  String get parkingTypeNormal => 'موقف عادي';

  @override
  String get parkingTypeNormalShort => 'عادي';

  @override
  String get parkingTypeStreet => 'الطريق العام';

  @override
  String get sheetFreeSpots => 'أماكن شاغرة';

  @override
  String get sheetHourly => 'ثمن الساعة';

  @override
  String sheetManagedBy(String owner) {
    return 'يسيّره $owner';
  }

  @override
  String get sheetReserve => 'حجز مكان';

  @override
  String get sheetFull => 'ممتلئ';

  @override
  String get bookingTitle => 'حجز';

  @override
  String get bookingStepSpot => 'المكان';

  @override
  String get bookingStepDetails => 'الفترة';

  @override
  String get bookingStepSummary => 'الملخص';

  @override
  String get bookingLoadError => 'تعذّر تحميل هذا الموقف';

  @override
  String get bookingRangeOrder => 'يجب أن تكون النهاية بعد البداية.';

  @override
  String get bookingRangeMax => 'المدة القصوى: 24 ساعة.';

  @override
  String get bookingRangePast => 'لا يمكن أن تكون البداية في الماضي.';

  @override
  String get bookingConfirmed => 'تم تأكيد الحجز';

  @override
  String bookingConfirmedDetail(int spot, int hours, String amount) {
    return 'المكان رقم $spot — $hours س مقابل $amount';
  }

  @override
  String get bookingSeeReservations => 'عرض حجوزاتي';

  @override
  String get bookingConfirm => 'تأكيد الحجز';

  @override
  String get bookingNoSpots => 'لا توجد أماكن مسجلة';

  @override
  String get bookingNoSpotsHint => 'لم تُضبط أماكن هذا الموقف بعد.';

  @override
  String get bookingSelectSpot => 'اختر مكانًا';

  @override
  String bookingFreeOf(int free, int total) {
    String _temp0 = intl.Intl.pluralLogic(
      free,
      locale: localeName,
      other: '$free مكان شاغر من أصل $total',
      many: '$free مكانًا شاغرًا من أصل $total',
      few: '$free أماكن شاغرة من أصل $total',
      two: 'مكانان شاغران من أصل $total',
      one: 'مكان شاغر واحد من أصل $total',
      zero: 'لا مكان شاغر من أصل $total',
    );
    return '$_temp0';
  }

  @override
  String get legendReserved => 'محجوز';

  @override
  String get spotStateFree => 'شاغر';

  @override
  String get spotStateReserved => 'محجوز';

  @override
  String get spotStateOccupied => 'مشغول';

  @override
  String get spotStateUnavailable => 'غير متاح';

  @override
  String spotSemantics(int n, String state) {
    return 'المكان $n، $state';
  }

  @override
  String get bookingVehicle => 'مركبتك';

  @override
  String get fieldPlate => 'لوحة الترقيم';

  @override
  String get plateHint => '12345-A-61';

  @override
  String get plateRequired => 'أدخل لوحة الترقيم.';

  @override
  String get bookingSlot => 'الفترة';

  @override
  String get bookingStart => 'البداية';

  @override
  String get bookingEnd => 'النهاية';

  @override
  String get bookingBilled => 'المدة المفوترة';

  @override
  String get bookingEstimate => 'التقدير';

  @override
  String get bookingPriceNote =>
      'كل ساعة بدأت تُحتسب كاملة. يحدد الخادم المبلغ النهائي.';

  @override
  String get bookingPlate => 'لوحة الترقيم';

  @override
  String get bookingTotal => 'المجموع التقديري';

  @override
  String get bookingCancelNote =>
      'الإلغاء ممكن، مع رسوم 20٪ بعد أن يصبح الحجز نشطًا.';

  @override
  String get resTitle => 'حجوزاتي';

  @override
  String get resEmpty => 'لا توجد حجوزات';

  @override
  String get resEmptyHint => 'ستظهر حجوزاتك هنا.';

  @override
  String get resHistory => 'السجل';

  @override
  String get resNoPast => 'لا توجد حجوزات سابقة حاليًا.';

  @override
  String get resCancelTitle => 'إلغاء الحجز؟';

  @override
  String resCancelBody(String amount) {
    return 'ستُطبَّق رسوم إلغاء بنسبة 20٪، أي حوالي $amount.';
  }

  @override
  String get resCancelConfirm => 'إلغاء الحجز';

  @override
  String resCancelled(String amount) {
    return 'تم إلغاء الحجز · رسوم $amount';
  }

  @override
  String resPaid(String amount) {
    return 'تم قبول الأداء · $amount';
  }

  @override
  String get resPayOnSite => 'يُؤدّى للحارس عند وصولك.';

  @override
  String get resNoCode => 'لا يوجد رمز دخول لهذا الحجز.';

  @override
  String resExtended(String time, String amount) {
    return 'تم تمديد الحجز حتى $time · $amount';
  }

  @override
  String get resNoPosition => 'موقع الموقف غير متاح.';

  @override
  String get resNavFailed => 'تعذّر فتح الملاحة.';

  @override
  String get resOverstay => 'تجاوز المدة';

  @override
  String get resInProgress => 'جارٍ';

  @override
  String resOverstayOf(String time) {
    return 'تجاوز بمدة $time';
  }

  @override
  String resRemainingOf(String time) {
    return 'الوقت المتبقي $time';
  }

  @override
  String get resBeyond => 'بعد انتهاء الفترة';

  @override
  String get resLeft => 'متبقٍ';

  @override
  String get resOverstayWarning =>
      'تجاوزت الفترة المحجوزة: يمكن للتقني تحرير غرامة.';

  @override
  String get resEntryCode => 'رمز الدخول';

  @override
  String get resExtend => 'تمديد';

  @override
  String get resGo => 'الذهاب';

  @override
  String get resPay => 'أداء';

  @override
  String resAwaitCash(String amount) {
    return 'يُؤدّى للحارس · $amount';
  }

  @override
  String resUnpaid(String amount) {
    return 'غير مؤدّى · $amount';
  }

  @override
  String resPastLine(int spot, int hours, String amount) {
    return 'المكان رقم $spot · $hours س · $amount';
  }

  @override
  String get qrHint => 'اعرض هذا الرمز عند المدخل لتأكيد وصولك.';

  @override
  String get extendTitle => 'تمديد الحجز';

  @override
  String get extendChoose => 'اختر المدة الإضافية.';

  @override
  String extendCurrentEnd(String time) {
    return 'النهاية الحالية: $time';
  }

  @override
  String extendUntil(String time) {
    return 'حتى $time';
  }

  @override
  String extendApprox(String amount) {
    return ' · حوالي $amount';
  }

  @override
  String get extendTooLong => 'يتجاوز حد 24 ساعة';

  @override
  String get extendServerNote => 'يحدد الخادم المبلغ الدقيق.';

  @override
  String get duration30m => '30 دقيقة';

  @override
  String get duration1h => 'ساعة واحدة';

  @override
  String get duration2h => 'ساعتان';

  @override
  String get duration3h => '3 ساعات';

  @override
  String get statusDone => 'منتهٍ';

  @override
  String get statusCancelled => 'ملغى';

  @override
  String get statusPending => 'قيد الانتظار';

  @override
  String get cmpTitle => 'الشكايات';

  @override
  String get cmpSent => 'تم إرسال الشكاية';

  @override
  String get cmpReport => 'الإبلاغ عن مشكلة';

  @override
  String get cmpParking => 'الموقف المعني';

  @override
  String get cmpChooseParking => 'اختر موقفًا.';

  @override
  String get cmpMessage => 'رسالتك';

  @override
  String get cmpMessageHint => 'صف المشكلة التي واجهتها…';

  @override
  String get cmpMessageMin => '10 أحرف على الأقل.';

  @override
  String get cmpMine => 'شكاياتي';

  @override
  String get cmpNone => 'لم ترسل أي شكاية.';

  @override
  String get cmpResolved => 'معالَجة';

  @override
  String get cmpOpen => 'قيد المعالجة';

  @override
  String get profileTitle => 'حسابي';

  @override
  String get profileWallet => 'المحفظة';

  @override
  String get profileLoyalty => 'الوفاء';

  @override
  String get profileRewardsError => 'تعذّر تحميل مكافآتك';

  @override
  String get profileNoPoints => 'لا توجد نقاط بعد';

  @override
  String get profileNoPointsHint => 'تتراكم نقاطك مع كل زيارة منتهية.';

  @override
  String profileStays(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count زيارة',
      many: '$count زيارة',
      few: '$count زيارات',
      two: 'زيارتان',
      one: 'زيارة واحدة',
      zero: 'لا زيارات',
    );
    return '$_temp0';
  }

  @override
  String get profileRewards => 'المكافآت';

  @override
  String get profileSettings => 'الإعدادات';

  @override
  String get profileLogout => 'تسجيل الخروج';

  @override
  String get logoutTitle => 'تسجيل الخروج؟';

  @override
  String get logoutBody =>
      'سيتعين عليك إدخال بريدك الإلكتروني وكلمة المرور من جديد.';

  @override
  String get logoutStay => 'البقاء متصلًا';

  @override
  String get logoutConfirm => 'تسجيل الخروج';

  @override
  String get walletBalance => 'الرصيد';

  @override
  String get walletUnavailable => 'غير متاح';

  @override
  String rewardProgress(int current, int required) {
    return '$current / $required زيارة';
  }

  @override
  String get themeTitle => 'المظهر';

  @override
  String get themeLight => 'فاتح';

  @override
  String get themeDark => 'داكن';

  @override
  String get themeSystem => 'حسب النظام';

  @override
  String get languageTitle => 'اللغة';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageArabic => 'العربية';

  @override
  String get notificationsTitle => 'الإشعارات';

  @override
  String get comingSoon => 'قريبًا';

  @override
  String get roleTechnician => 'تقني';

  @override
  String get walletTitle => 'المحفظة';

  @override
  String get walletLoadError => 'تعذّر تحميل محفظتك';

  @override
  String get walletHistory => 'السجل';

  @override
  String get walletEmpty => 'لا توجد عمليات حاليًا.';

  @override
  String get walletAvailable => 'الرصيد المتاح';

  @override
  String get walletTopUp => 'تعبئة';

  @override
  String walletToppedUp(String amount) {
    return 'تمت تعبئة المحفظة بمبلغ $amount';
  }

  @override
  String get walletTopUpRefused => 'تم رفض التعبئة.';

  @override
  String get walletTopUpTitle => 'تعبئة المحفظة';

  @override
  String get walletTopUpHint => 'يُقتطع المبلغ من بطاقتك البنكية.';

  @override
  String get walletOtherAmount => 'مبلغ آخر';

  @override
  String get walletAmountHint => 'مثال: 75';

  @override
  String get walletLimits => 'بين 1 و5000 درهم.';

  @override
  String get walletChoose => 'اختر مبلغًا';

  @override
  String get payStatusPaid => 'مؤدّى';

  @override
  String get payStatusPending => 'قيد الانتظار';

  @override
  String get payStatusFailed => 'فاشل';

  @override
  String get payStatusRefunded => 'مستردّ';

  @override
  String get payStatusCancelled => 'ملغى';

  @override
  String get paymentKindTopup => 'تعبئة';

  @override
  String get paymentKindRefund => 'استرداد';

  @override
  String get paymentKindBooking => 'ركن';

  @override
  String get methodWallet => 'المحفظة';

  @override
  String get methodCard => 'بطاقة بنكية';

  @override
  String get methodCash => 'نقدًا في عين المكان';

  @override
  String get payTitle => 'الأداء';

  @override
  String payDetail(int spot, int hours) {
    return 'المكان رقم $spot · $hours س';
  }

  @override
  String get payTotal => 'المبلغ المستحق';

  @override
  String get payReadingBalance => 'جارٍ قراءة الرصيد…';

  @override
  String get payBalanceUnavailable => 'الرصيد غير متاح';

  @override
  String payBalance(String amount) {
    return 'الرصيد $amount';
  }

  @override
  String payBalanceLow(String amount) {
    return 'رصيد غير كافٍ ($amount)';
  }

  @override
  String get payCardSubtitle => 'اقتطاع فوري';

  @override
  String get payCashSubtitle => 'يُؤدّى للحارس عند المدخل';

  @override
  String get payOnSite => 'الأداء في عين المكان';

  @override
  String payAmount(String amount) {
    return 'أداء $amount';
  }

  @override
  String get payRefused => 'تم رفض الأداء. جرّب وسيلة أخرى.';

  @override
  String get streetsTitle => 'الطريق العام';

  @override
  String get streetsEmpty => 'لا توجد شوارع';

  @override
  String get streetsEmptyHint => 'لم يُسجَّل أي ركن على الطريق العام.';

  @override
  String get streetsSearch => 'ابحث عن شارع…';

  @override
  String streetsNoResult(String query) {
    return 'لا نتائج لـ «$query».';
  }

  @override
  String streetsStats(int free, int occupied, int total) {
    return '$free شاغر · $occupied مشغول من أصل $total';
  }

  @override
  String get spotFreeTitle => 'مكان شاغر';

  @override
  String spotOverstaySince(String time) {
    return 'تجاوز منذ $time';
  }

  @override
  String spotUntil(String time) {
    return 'حتى $time';
  }

  @override
  String get badgeFine => 'غرامة';

  @override
  String get fineTitle => 'تحرير غرامة';

  @override
  String fineSubtitle(String street, int spot) {
    return '$street · المكان رقم $spot';
  }

  @override
  String get finePlate => 'لوحة الترقيم';

  @override
  String get finePlateRequired => 'أدخل لوحة الترقيم.';

  @override
  String get fineReason => 'السبب';

  @override
  String get fineReasonRequired => 'حدد السبب.';

  @override
  String get fineSubmit => 'تحرير الغرامة';

  @override
  String get fineReasonOverstay => 'تجاوز المدة';

  @override
  String get fineReasonNoBooking => 'ركن بدون حجز';

  @override
  String get fineReasonObstruction => 'ركن معرقل';

  @override
  String get finePhoto => 'صورة اللوحة';

  @override
  String get fineAddPhoto => 'التقاط صورة';

  @override
  String get fineRetakePhoto => 'إعادة الالتقاط';

  @override
  String get fineRemovePhoto => 'حذف الصورة';

  @override
  String get finePhotoHint => 'صورة اللوحة دليل في حال الاعتراض.';

  @override
  String get finePhotoFailed => 'تعذّر فتح الكاميرا.';

  @override
  String get fineIssued => 'تم تحرير الغرامة';

  @override
  String get fineIssuedWithPhoto => 'تم تحرير الغرامة مع الصورة';

  @override
  String get finesTitle => 'الغرامات المحررة';

  @override
  String get finesEmpty => 'لم تحرر أي غرامة';

  @override
  String get finesEmptyHint => 'ستظهر هنا الغرامات التي تحررها.';

  @override
  String get finesPhotoBadge => 'صورة مرفقة';

  @override
  String get scanTitle => 'تأكيد دخول';

  @override
  String get scanHint => 'ضع رمز QR الخاص بالسائق داخل الإطار.';

  @override
  String get scanManual => 'إدخال الرمز';

  @override
  String get scanManualTitle => 'رمز الدخول';

  @override
  String get scanManualHint => 'يظهر الرمز أسفل رمز QR في تطبيق السائق.';

  @override
  String get scanValidate => 'تأكيد';

  @override
  String get scanChecking => 'جارٍ التأكيد…';

  @override
  String get scanOk => 'تم تأكيد الدخول';

  @override
  String scanOkDetail(String plate, int spot) {
    return '$plate · المكان رقم $spot';
  }

  @override
  String get scanNotAutopark => 'هذا الرمز ليس رمز AutoPark.';

  @override
  String get scanPermission => 'اسمح باستعمال الكاميرا لمسح رموز QR.';

  @override
  String get scanCameraError => 'الكاميرا غير متاحة. أدخل الرمز يدويًا.';

  @override
  String get scanAgain => 'مسح رمز آخر';

  @override
  String get scanTorch => 'المصباح';

  @override
  String get scanFailed => 'تم رفض الدخول';

  @override
  String get bookingSlotHint =>
      'اختر توقيتك أولًا: لن تُعرض عليك إلا الأماكن الشاغرة في هذه الفترة.';

  @override
  String bookingForSlot(String range) {
    return 'الفترة: $range';
  }

  @override
  String get bookingSlotFull => 'لا توجد أماكن شاغرة في هذه الفترة';

  @override
  String get bookingSlotFullHint =>
      'جميع الأماكن محجوزة بين هذين الموعدين. جرّب توقيتًا آخر.';

  @override
  String get bookingChangeSlot => 'تغيير الفترة';

  @override
  String get bookingSpotsLoadError => 'تعذّر تحميل الأماكن لهذه الفترة';

  @override
  String bookingSpotTaken(int spot) {
    return 'المكان رقم $spot لم يعد شاغرًا في هذه الفترة. اختر مكانًا آخر.';
  }

  @override
  String get securityTitle => 'الأمان';

  @override
  String get securitySubtitle => 'كلمة المرور والأجهزة المتصلة';

  @override
  String get securityIntro => 'تغيير كلمة المرور يسجّل خروجك من أجهزتك الأخرى.';

  @override
  String get securityCurrent => 'كلمة المرور الحالية';

  @override
  String get securityNew => 'كلمة المرور الجديدة';

  @override
  String get securityNewHint => '8 أحرف على الأقل.';

  @override
  String get securityConfirm => 'تأكيد كلمة المرور الجديدة';

  @override
  String get securitySubmit => 'تغيير كلمة المرور';

  @override
  String get securityChanged =>
      'تم تغيير كلمة المرور. تم تسجيل الخروج من أجهزتك الأخرى.';

  @override
  String get securityErrCurrent => 'أدخل كلمة المرور الحالية.';

  @override
  String get securityErrLength => '8 أحرف على الأقل.';

  @override
  String get securityErrSame => 'اختر كلمة مرور مختلفة عن الحالية.';

  @override
  String get securityErrConfirm => 'كلمتا المرور غير متطابقتين.';

  @override
  String get securityEverywhere => 'الأجهزة المتصلة';

  @override
  String get securityEverywhereHint =>
      'هل فقدت هاتفك؟ أنهِ جميع جلساتك، بما فيها هذه الجلسة.';

  @override
  String get securityEverywhereConfirmTitle => 'تسجيل الخروج من جميع الأجهزة؟';

  @override
  String get securityEverywhereConfirmBody =>
      'سيتعين عليك تسجيل الدخول من جديد على كل أجهزتك، بما فيها هذا الجهاز.';

  @override
  String get securityEverywhereConfirm => 'تسجيل الخروج من الكل';
}
