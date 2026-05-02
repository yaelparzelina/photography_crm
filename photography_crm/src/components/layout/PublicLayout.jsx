export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  )
}
