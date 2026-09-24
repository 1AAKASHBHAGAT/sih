import React, { useState, useEffect } from 'react';
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
  
  // Default tab based on authentication state & role
  const getInitialTab = (userRole: UserRole) => {
    switch (userRole) {
      case 'citizen': return 'submit';
      case 'university_admin': return 'university';
      case 'government': return 'analytics';
      case 'industry': return 'industry';
      default: return 'gate';
    }
  };

  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab(role));
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<string | null>(null);

  // Automatically update active tab whenever user role changes
  useEffect(() => {
    if (isAuthenticated && role && role !== 'guest') {
      setActiveTab(getInitialTab(role));
    }
  }, [isAuthenticated, role]);

  const handleOpenLogin = (targetRole: string | null = null) => {
    setTargetLoginRole(targetRole);
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (userRole: UserRole) => {
    setActiveTab(getInitialTab(userRole));
  };

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

      {/* Main Content Area: Renders active tier workspace */}
      <main className="flex-1 w-full py-4 max-w-7xl mx-auto px-4">
        {(!isAuthenticated || activeTab === 'gate') && (
          <RoleGateLanding onLoginSuccess={handleLoginSuccess} />
        )}

        {(isAuthenticated || activeTab === 'submit') && activeTab === 'submit' && (
          <CitizenSubmit 
            onOpenTicketLookup={() => setTicketModalOpen(true)}
          />
        )}

        {(isAuthenticated || activeTab === 'university') && activeTab === 'university' && (
          <UniversityQueue />
        )}

        {(isAuthenticated || activeTab === 'analytics') && activeTab === 'analytics' && (
          <AdminDashboard />
        )}

        {(isAuthenticated || activeTab === 'industry') && activeTab === 'industry' && (
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
