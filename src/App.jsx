import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { NotificationProvider } from './contexts/NotificationContext';

// Modules
import LandingPage from './assets/Modules/landingPage';
import LogInPage from './assets/Modules/logInPage';
import SignUpPage from './assets/Modules/signUpPage';
import Terms from './assets/Modules/Terms';
import Privacy from './assets/Modules/Privacy';

// Layouts
import ResLayout from './components/Layouts/ResLayout';
import SpLayout from './components/Layouts/spLayout';
import DevLayout from './components/Layouts/DevLayout';
import Pre_VPLayout from './components/Layouts/Pre_VPLayout';
import Secu_RespoLayout from './components/Layouts/Secu_RespoLayout';
import SecLayout from './components/Layouts/SecLayout';

// Shared Pages
import AccountManagementPage from './components/Pages/Sharable/accountmanagementPage';
import AnnouncementPage from './components/Pages/Sharable/announcementPage';
import ReqAndCompPage from './components/Pages/Sharable/reqAndCompPage';
import EmergencyLogsPage from './components/Pages/Sharable/emergencyLogsPage';
import FaqsPage from './components/Pages/Sharable/faqsPage';
import FeedbackPage from './components/Pages/Sharable/feedBackPage';
import VisitorLogsPage from './components/Pages/Sharable/visitorLogsPage';
import ArchivedVisitorLogsPage from './components/Pages/Sharable/archivedVisitorLogsPage';
import ArchivedReqAndCompPage from './components/Pages/Sharable/archivedReqAndCompPage';
import ArchivedEmergencyLogsPage from './components/Pages/Sharable/archivedEmergencyLogsPage';
import ArchivedAccountManagementPage from './components/Pages/Sharable/archivedAccountmanagementPage';
import OfficialsPage from './components/Pages/Sharable/officialBoardPage';
import IdScanPage from './components/Pages/Sharable/idScanPage';
import FeedBackDetailsPage from './components/Pages/Sharable/feedBackDetailsPage';
import ArchivedFeedBackPage from './components/Pages/Sharable/archivedFeedBackPage';
import ArchivedAnnouncementPage from './components/Pages/Sharable/archivedAnnouncementPage';
import ArchivedFaqsPage from './components/Pages/Sharable/archivedFaqsPage';

// Resident Pages
import AnnouncementPageRes from './components/Pages/Res/announcementPage-Res';
import ReqAndCompRes from './components/Pages/Res/reqAndComp-Res';
import SosPageRes from './components/Pages/Res/sosPage-Res';
import OfficialsPageRes from './components/Pages/Res/officialsBoardPage-Res';
import FaqsPageRes from './components/Pages/Res/faqsPage-Res';
import FeedbackPageRes from './components/Pages/Res/feedbackPage-Res';



// Profile
import ProfilePage from './components/partials/profilePage';

// Socket configuration
import { SOCKET_CONFIG } from './config/socket';
const socket = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Listen for initial table data
    socket.on('tableData', setUsers);

    // Listen for new user insert
    socket.on('newData', (newUser) => setUsers((prev) => [newUser, ...prev]));

    // Listen for polling refresh
    socket.on('refreshData', setUsers);

    return () => {
      socket.off('tableData');
      socket.off('newData');
      socket.off('refreshData');
    };
  }, []);

  return (
    <NotificationProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LogInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Resident Layout */}
          <Route path="/reslayout" element={<ResLayout />}>
            <Route index element={<AnnouncementPageRes />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="requests" element={<ReqAndCompRes />} />
            <Route path="sos" element={<SosPageRes />} />
            <Route path="officials" element={<OfficialsPageRes />} />
            <Route path="faqs" element={<FaqsPageRes />} />
            <Route path="feedback" element={<FeedbackPageRes />} />
          </Route>

          {/* Super/Admin Layout */}
          <Route path="/spLayout" element={<SpLayout />}>
            <Route index element={<AnnouncementPage />} />
            <Route path="accountmanagement" element={<AccountManagementPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="requests" element={<ReqAndCompPage />} />
            <Route path="archivedRequests" element={<ArchivedReqAndCompPage />} />
            <Route path="emergencyLogs" element={<EmergencyLogsPage />} />
            <Route path="archivedEmergencyLogs" element={<ArchivedEmergencyLogsPage />} />
            <Route path="archivedAccountmanagement" element={<ArchivedAccountManagementPage />} />
            <Route path="faqs" element={<FaqsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="feedBackDetails" element={<FeedBackDetailsPage />} />
            <Route path="archivedFeedBack" element={<ArchivedFeedBackPage />} />
            <Route path="visitorLogs" element={<VisitorLogsPage />} />
            <Route path="archivedVisitorLogs" element={<ArchivedVisitorLogsPage />} />
            <Route path="officials" element={<OfficialsPage />} />
            <Route path="idScan" element={<IdScanPage />} />
            <Route path="archived-announcements" element={<ArchivedAnnouncementPage />} />
            <Route path="archived-faqs" element={<ArchivedFaqsPage />} />
          </Route>

          {/* Developer Layout */}
          <Route path="/devlayout" element={<DevLayout />}>
            <Route index element={<AccountManagementPage />} />
            <Route path="accountmanagement" element={<AccountManagementPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="feedBackDetails" element={<FeedBackDetailsPage />} />
            <Route path="archivedFeedBack" element={<ArchivedFeedBackPage />} />
          </Route>

          {/* Pre VP Layout */}
          <Route path="/Pre_VPLayout" element={<Pre_VPLayout />}>
            <Route index element={<AnnouncementPageRes />} />
            <Route path="accountmanagement" element={<AccountManagementPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="requests" element={<ReqAndCompPage />} />
            <Route path="archivedRequests" element={<ArchivedReqAndCompPage />} />
            <Route path="emergencyLogs" element={<EmergencyLogsPage />} />
            <Route path="archivedEmergencyLogs" element={<ArchivedEmergencyLogsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="feedBackDetails" element={<FeedBackDetailsPage />} />
            <Route path="archivedFeedBack" element={<ArchivedFeedBackPage />} />
            <Route path="visitorLogs" element={<VisitorLogsPage />} />
            <Route path="archivedVisitorLogs" element={<ArchivedVisitorLogsPage />} />
            <Route path="officials" element={<OfficialsPageRes />} />
            <Route path="idScan" element={<IdScanPage />} />
          </Route>

          {/* Security/Responsible Layout */}
          <Route path="/Secu_RespoLayout" element={<Secu_RespoLayout />}>
            <Route index element={<AnnouncementPageRes />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="emergencyLogs" element={<EmergencyLogsPage />} />
            <Route path="archivedEmergencyLogs" element={<ArchivedEmergencyLogsPage />} />
            <Route path="visitorLogs" element={<VisitorLogsPage />} />
            <Route path="archivedVisitorLogs" element={<ArchivedVisitorLogsPage />} />
            <Route path="officials" element={<OfficialsPageRes />} />
            <Route path="idScan" element={<IdScanPage />} />
          </Route>

          {/* Secretary Layout */}
          <Route path="/SecLayout" element={<SecLayout />}>
            <Route index element={<AnnouncementPage />} />
            <Route path="accountmanagement" element={<AccountManagementPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="requests" element={<ReqAndCompPage />} />
            <Route path="archivedRequests" element={<ArchivedReqAndCompPage />} />
            <Route path="emergencyLogs" element={<EmergencyLogsPage />} />
            <Route path="archivedEmergencyLogs" element={<ArchivedEmergencyLogsPage />} />
            <Route path="faqs" element={<FaqsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="feedBackDetails" element={<FeedBackDetailsPage />} />
            <Route path="visitorLogs" element={<VisitorLogsPage />} />
            <Route path="archivedVisitorLogs" element={<ArchivedVisitorLogsPage />} />
            <Route path="officials" element={<OfficialsPage />} />
            <Route path="idScan" element={<IdScanPage />} />
            <Route path="archived-faqs" element={<ArchivedFaqsPage />} />
          </Route>

          {/* Redirects */}
          <Route path="announcements" element={<Navigate to="/reslayout" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
