import { forwardRef } from 'react'
import AgreementTemplate from '../templates/AgreementTemplate'
import { formatDate } from '../utils/dateUtils'

const SignedAgreementDocument = forwardRef(function SignedAgreementDocument({ signedDoc }, ref) {
  return (
    <div ref={ref} dir="rtl" className="bg-white">
      <AgreementTemplate link={signedDoc.agreement || {}} date={signedDoc.signedAt} />
      <div className="px-8 pb-8 pt-4 border-t border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">אישור וחתימת הלקוח</h3>
        <div className="text-sm text-gray-700 space-y-1 mb-3">
          <p><span className="font-medium">שם:</span> {signedDoc.agreement?.clientName}</p>
          <p><span className="font-medium">אימייל:</span> {signedDoc.email}</p>
          <p><span className="font-medium">תאריך חתימה:</span> {formatDate(signedDoc.signedAt)}</p>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">חתימה:</p>
        <img src={signedDoc.signature} alt="חתימת הלקוח"
          className="h-28 max-w-full border-b border-gray-300" />
      </div>
    </div>
  )
})

export default SignedAgreementDocument
