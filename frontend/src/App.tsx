import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TicketLookupModal from './components/TicketLookupModal';
import LoginModal from './components/LoginModal';
import PresenterBar from './components/PresenterBar';
import RoleGateLanding from './components/RoleGateLanding';
import CitizenSubmit from './pages/CitizenSubmit';
import UniversityQueue from './pages/UniversityQueue';
import AdminDashboard from './pages/AdminDashboard';
import IndustryCatalog from './pages/IndustryCatalog';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';

const ROLE_TAB_MAP: Record<UserRole, string> = {
  citizen: 'submit',
  university_admin: 'university',
  government: 'analytics',
  industry: 'industry',
  guest: 'gate'
};

function AppContent() {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('gate');
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<string | null>(null);

  // Automatically navigate authenticated user to their role's dedicated category interface!
  useEffect(() => {
    if (isAuthenticated && role && role !== 'guest') {
      const targetTab = ROLE_TAB_MAP[role] || 'submit';
      setActiveTab(targetTab);
    } else if (!isAuthenticated) {
      setActiveTab('gate');
    }
  }, [isAuthenticated, role]);

  const handleOpenLogin = (targetRole: string | null = null) => {
    setTargetLoginRole(targetRole);
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (userRole: UserRole) => {
    const targetTab = ROLE_TAB_MAP[userRole] || 'submit';
    setActiveTab(targetTab);
  };

  return (
    <div className="min-h-screen w-full flex flex-col portal-bg text-slate-100 overflow-x-hidden">
      
      {/* Presenter Demo Bar */}
      <PresenterBar />

      {/* Header Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenTicketLookup={() => setTicketModalOpen(true)}
        onOpenLogin={handleOpenLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full py-4">
        {(!isAuthenticated || activeTab === 'gate') ? (
          <RoleGateLanding onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeTab === 'submit' && (
              <CitizenSubmit 
                onNavigateToUniversity={() => setActiveTab('university')}
                onOpenTicketLookup={() => setTicketModalOpen(true)}
              />
            )}

            {activeTab === 'university' && (
              <UniversityQueue />
            )}

            {activeTab === 'analytics' && (
              <AdminDashboard />
            )}

            {activeTab === 'industry' && (
              <IndustryCatalog />
            )}
          </>
        )}
      </main>

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
