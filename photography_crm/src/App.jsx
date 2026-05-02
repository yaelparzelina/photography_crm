import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientTicket from './pages/ClientTicket'
import Settings from './pages/Settings'
import ClientProposal from './pages/ClientProposal'
import ClientSigning from './pages/ClientSigning'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/client/:linkId" element={<ClientProposal />} />
      <Route path="/sign/:linkId" element={<ClientSigning />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients/:id" element={<ClientTicket />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
