import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { WelcomeProvider } from './context/WelcomeContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'
import WelcomeOverlay from './components/WelcomeOverlay'
import ScrollProgress from './components/ScrollProgress'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import DashboardPage from './pages/DashboardPage'
import ApprovalPage from './pages/ApprovalPage'
import MemberDirectoryPage from './pages/MemberDirectoryPage'
import TeamDetailPage from './pages/TeamDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'
import EventsPage from './pages/EventsPage'
import ProfilePage from './pages/ProfilePage'
import AnalyticsPage from './pages/AnalyticsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import TasksPage from './pages/TasksPage'
import { FOUNDER_ROLES } from './lib/permissions'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <WelcomeProvider>
            <PageTransition>
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
                    <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
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
                    <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                      <TeamDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/announcements"
                  element={
                    <ProtectedRoute>
                      <AnnouncementsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute allowedRoles={FOUNDER_ROLES}>
                      <AnalyticsPage />
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
            </PageTransition>
            <WelcomeOverlay />
            <ScrollProgress />
          </WelcomeProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App