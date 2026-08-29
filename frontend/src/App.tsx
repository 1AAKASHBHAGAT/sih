import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TicketLookupModal from './components/TicketLookupModal';
import LoginModal from './components/LoginModal';
import UserProfileModal from './components/UserProfileModal';
import PresenterBar from './components/PresenterBar';
import RoleGateLanding from './components/RoleGateLanding';
import CitizenSubmit from './pages/CitizenSubmit';
import UniversityQueue from './pages/UniversityQueue';
import AdminDashboard from './pages/AdminDashboard';
import IndustryCatalog from './pages/IndustryCatalog';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';

function AppContent() {
  const { isAuthenticated, role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('gate');
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<string | null>(null);

  const handleOpenLogin = (targetRole: string | null = null) => {
    setTargetLoginRole(targetRole);
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (userRole: UserRole) => {
    // Role selection successfully authenticated!
  };

  /* STRICT UNAUTHENTICATED GATE: Unauthenticated visitors see ONLY the Sign In / Sign Up interface */
  if (!isAuthenticated || !user || role === 'guest') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center portal-bg text-slate-900 px-4 py-8">
        <RoleGateLanding onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  /* AUTHENTICATED STAKEHOLDER WORKSPACE: Users see ONLY their assigned category workspace */
  return (
    <div className="min-h-screen w-full flex flex-col portal-bg text-slate-900 overflow-x-hidden">
      
      {/* Presenter Demo Bar */}
      <PresenterBar />

      {/* Header Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenTicketLookup={() => setTicketModalOpen(true)}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area: Strictly Scoped by Role */}
      <main className="flex-1 w-full py-4">
        {role === 'citizen' && (
          <CitizenSubmit 
            onOpenTicketLookup={() => setTicketModalOpen(true)}
          />
        )}

        {role === 'university_admin' && (
          <UniversityQueue />
        )}

        {role === 'government' && (
          <AdminDashboard />
        )}

        {role === 'industry' && (
          <IndustryCatalog />
        )}
      </main>

      {/* User Credentials & Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Ticket Tracking Modal */}
      <TicketLookupModal 
        isOpen={ticketModalOpen} 
        onClose={() => setTicketModalOpen(false)} 
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        targetRole={targetLoginRole}
      />

      {/* Institutional Footer */}
      <Footer />

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
