import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { LoginPage } from '@/pages/LoginPage';
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage';
import { AdminCVAnalysisPage } from '@/pages/admin/AdminCVAnalysisPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage';
import { AdminJudgesPage } from '@/pages/admin/AdminJudgesPage';
import { AdminParticipantsPage } from '@/pages/admin/AdminParticipantsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminTeamDetailPage } from '@/pages/admin/AdminTeamDetailPage';
import { AdminTeamsPage } from '@/pages/admin/AdminTeamsPage';
import { StudentAnnouncementsPage } from '@/pages/student/StudentAnnouncementsPage';
import { StudentCandidateProfilePage } from '@/pages/student/StudentCandidateProfilePage';
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { StudentHistoryHackathonsPage } from '@/pages/student/StudentHistoryHackathonsPage';
import { StudentHackathonsPage } from '@/pages/student/StudentHackathonsPage';
import { StudentProfilePage } from '@/pages/student/StudentProfilePage';
import { StudentSupportPage } from '@/pages/student/StudentSupportPage';
import { StudentTeamDirectoryDetailPage } from '@/pages/student/StudentTeamDirectoryDetailPage';
import { StudentTeamPage } from '@/pages/student/StudentTeamPage';
import { StudentTeamsPage } from '@/pages/student/StudentTeamsPage';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

const ProtectedRoute = ({ role }: { role: UserRole }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.currentUser);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/admin/dashboard'} replace />;
  }

  return <Outlet />;
};

const RoleRedirect = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.currentUser);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/admin/dashboard'} replace />;
};

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RoleRedirect />} />

    <Route element={<ProtectedRoute role="student" />}>
      <Route path="/student" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="team" element={<StudentTeamPage />} />
        <Route path="teams" element={<StudentTeamsPage />} />
        <Route path="teams/:teamId" element={<StudentTeamDirectoryDetailPage />} />
        <Route path="team/candidate/:participantId" element={<StudentCandidateProfilePage />} />
        <Route path="history-hackathons" element={<StudentHistoryHackathonsPage />} />
        <Route path="hackathons" element={<StudentHackathonsPage />} />
        <Route path="announcements" element={<StudentAnnouncementsPage />} />
        <Route path="support" element={<StudentSupportPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="participants" element={<AdminParticipantsPage />} />
        <Route path="teams" element={<AdminTeamsPage />} />
        <Route path="team-detail" element={<AdminTeamDetailPage />} />
        <Route path="judges" element={<AdminJudgesPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="cv-analysis" element={<AdminCVAnalysisPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
