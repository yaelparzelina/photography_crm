import { formatDate } from '../utils/dateUtils'

export default function ProposalTemplate({ photoshootTypeName, packages }) {
  const today = formatDate(new Date())
  return (
    <div className="p-8 font-sans" dir="rtl">
      <div className="text-center mb-10">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Revital Parzelina Photography" className="h-24 mx-auto mb-2" />
        <div className="w-12 h-px bg-gray-300 mx-auto my-4" />
        <p className="text-sm text-gray-500">הצעת מחיר</p>
        <p className="text-xs text-gray-400 mt-1">{today}</p>
        <h2 className="text-xl font-semibold text-gray-800 mt-6">צילומי {photoshootTypeName}</h2>
      </div>

      <div className="space-y-5">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
              <span className="text-2xl font-light text-gray-900">₪{pkg.price?.toLocaleString()}</span>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>• {pkg.photoCount} תמונות ערוכות ברמה גבוהה</li>
              <li>• {pkg.locationCount} {pkg.locationCount === 1 ? 'לוקיישן' : 'לוקיישנים'}</li>
              {pkg.includesAlbum && (
                <li>• אלבום מעוצב ומודפס בגודל {pkg.albumSize}, {pkg.albumPages} עמודים, פתיחה שטוחה</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 text-center space-y-1">
        <p className="text-sm font-medium text-gray-700">רויטל פרצלינה</p>
        <div className="text-xs text-gray-400 space-y-1">
          <p>054-8788851 | rparzelina@gmail.com | @revital_photography</p>
          <p>לפרטים נוספים ולתיאום — נשמח לשמוע מכם</p>
        </div>
      </div>
    </div>
  )
}
