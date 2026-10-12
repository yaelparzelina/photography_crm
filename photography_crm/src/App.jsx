import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import ClientBoard from './pages/ClientBoard'
import ClientsDatabase from './pages/ClientsDatabase'
import ClientTicket from './pages/ClientTicket'
import Settings from './pages/Settings'
import Messages from './pages/Messages'
import MailingList from './pages/MailingList'
import Unsubscribe from './pages/Unsubscribe'
import ClientProposal from './pages/ClientProposal'
import ClientSigning from './pages/ClientSigning'
import DressGuides from './pages/DressGuides'
import DressGuideEditor from './pages/DressGuideEditor'
import DressGuidePage from './pages/DressGuidePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/client/:linkId" element={<ClientProposal />} />
      <Route path="/sign/:linkId" element={<ClientSigning />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/dress/:slug" element={<DressGuidePage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route index element={<ClientBoard />} />
          <Route path="clients" element={<ClientsDatabase />} />
          <Route path="clients/:id" element={<ClientTicket />} />
          <Route path="messages" element={<Messages />} />
          <Route path="mailing-list" element={<MailingList />} />
          <Route path="dress-guides" element={<DressGuides />} />
          <Route path="dress-guides/:slug" element={<DressGuideEditor />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
