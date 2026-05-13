import { formatDate } from '../utils/dateUtils'

export default function AgreementTemplate({ link }) {
  const today = formatDate(new Date())
  const shootDate = link.shootDate
    ? formatDate(link.shootDate.toDate ? link.shootDate.toDate() : new Date(link.shootDate))
    : '___________'

  return (
    <div className="p-8 font-sans leading-relaxed" dir="rtl">
      {/* Header */}
      <div className="text-center mb-6">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Revital Parzelina Photography" className="h-24 mx-auto" />
      </div>

      {/* Document title */}
      <div className="mb-4">
        <p className="text-xs text-gray-400">{today}</p>
        <h2 className="text-xl font-bold text-gray-900 mt-1">
          הסכם עבודת צילום {link.photoshootTypeName} ל{link.clientName}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          הסכם הוא בין הצלמת רויטל פרצלינה, לבין {link.clientName}
        </p>
      </div>

      <div className="w-full h-px bg-gray-200 my-5" />

      {/* Package details */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">חבילת הצילום כוללת</h3>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>✓ סשן צילומי {link.photoshootTypeName} — {link.packageName} בתאריך {shootDate}</li>
          <li>✓ {link.photoCount} תמונות ערוכות ברמה גבוהה</li>
          {link.includesAlbum && link.albumSize && (
            <li>✓ אלבום מעוצב ומודפס בגודל {link.albumSize} ס"מ, {link.albumPages} עמודים, פתיחה שטוחה</li>
          )}
        </ul>
        {link.price && (
          <p className="text-sm font-semibold text-gray-900 mt-3">עלות החבילה — ₪{link.price?.toLocaleString()}</p>
        )}
      </div>

      <div className="w-full h-px bg-gray-200 my-5" />

      {/* Photo delivery */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">קבלת התמונות</h3>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>• התמונות הערוכות יישלחו למצולמים למייל, באיכות מעולה, בגלריה אינטרנטית, עד 10 ימי עסקים מיום הצילומים, כשהן מוכנות לכל שימוש: הדפסה, שיתוף במדיה ועוד.</li>
          <li>• יימסרו תמונות ערוכות בלבד ללא חומרי גלם.</li>
          {link.includesAlbum && (
            <li>• האלבום יימסר עם שליח לבית הלקוח, תוך 10 ימי עסקים, מיום אישור הדפסה מצד הלקוח.</li>
          )}
        </ul>
      </div>

      <div className="w-full h-px bg-gray-200 my-5" />

      {/* Payment */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">תנאי תשלום</h3>
        <p className="text-sm text-gray-700">
          במועד תיאום סשן צילומים תגבה מקדמה על סך 300₪ אשר תועבר ביום אישור ההסכם,
          באמצעות אפליקציות <strong>Bit</strong> או <strong>PayBox</strong> למספר טלפון האישי <strong>054-2514444</strong>.
          יתרת התשלום תועבר ביום הצילומים עצמו במזומן או באפליקציות הנ"ל.
        </p>
      </div>

      <div className="w-full h-px bg-gray-200 my-5" />

      {/* Cancellation */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">ביטולים ודחיות</h3>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>• במקרה של ביטול שבועיים לפני יום הצילומים יוחזר סכום המקדמה במלואו.</li>
          <li>• ביטול של שבוע או פחות לפני מועד הצילומים יחויב במקדמה.</li>
          <li>• דחייה תתאפשר למועד חדש עד חצי שנה ממועד הצילום המקורי.</li>
          <li>• דחייה עד יומיים לפני מועד הצילומים — ללא עלות.</li>
          <li>• דחייה פחות מ-48 שעות לפני מועד הצילומים תחוייב ב-100₪.</li>
        </ul>
      </div>

      <div className="w-full h-px bg-gray-200 my-5" />

      {/* Copyright */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-3">זכויות יוצרים</h3>
        <p className="text-sm text-gray-700 mb-2">
          זכות היוצרים הינה של הצלמת רויטל פרצלינה בלבד. אי לכך, הצילומים והזכויות עליהם יהיו בבעלותה הבלעדית של הצלמת.
        </p>
        <p className="text-sm text-gray-700">
          התמונות הינן לשימוש אישי ועסקי בלבד של הלקוחות, או פרסום במדיות השונות אשמח לציון קרדיט לצלמת. בנוסף לשימוש עסקי של הצלמת אם ניתן אישור פרסום בלבד.
        </p>
      </div>

      {/* Closing */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-4">מצפה ומחכה ליום הצילומים :)</p>
        <p className="text-xl font-medium text-gray-900">רויטל פרצלינה</p>
        <div className="mt-4 text-xs text-gray-400 space-y-0.5">
          <p>054-8788851 | rparzelina@gmail.com | @revital_photography</p>
        </div>
      </div>
    </div>
  )
}
