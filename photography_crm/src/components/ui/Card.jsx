import { cardClass } from './styles'

export default function Card({ title, className = '', children }) {
  return (
    <section className={`${cardClass} p-6 ${className}`}>
      {title && <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>}
      {children}
    </section>
  )
}
