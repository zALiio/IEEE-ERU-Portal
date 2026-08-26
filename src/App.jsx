import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import DashboardPage from './pages/DashboardPage'
import ApprovalPage from './pages/ApprovalPage'
import MemberDirectoryPage from './pages/MemberDirectoryPage'
import TeamDetailPage from './pages/TeamDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'
import EventsPage from './pages/EventsPage'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pending" element={<PendingApprovalPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approve"
              element={
                <ProtectedRoute allowedRoles={['excom', 'admin']}>
                  <ApprovalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/directory"
              element={
                <ProtectedRoute allowedRoles={['leader', 'excom', 'admin']}>
                  <MemberDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team/:teamId"
              element={
                <ProtectedRoute allowedRoles={['excom', 'admin']}>
                  <TeamDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
