import React, { useState } from 'react';
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

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('gate'); // 'gate', 'submit', 'university', 'analytics', 'industry'
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<string | null>(null);

  const handleOpenLogin = (role: string | null = null) => {
    setTargetLoginRole(role);
    setLoginModalOpen(true);
  };

  const handleSelectTier = (tabId: string, roleName: UserRole) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen w-full flex flex-col portal-bg text-slate-100 overflow-x-hidden">
      
      {/* Feature Gated Demo Presenter Mode Toolbar */}
      <PresenterBar />

      {/* Header & Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenTicketLookup={() => setTicketModalOpen(true)}
        onOpenLogin={handleOpenLogin}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full py-4">
        {activeTab === 'gate' && (
          <RoleGateLanding 
            onSelectTier={handleSelectTier}
            onOpenLogin={handleOpenLogin}
          />
        )}

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
      </main>

      {/* Ticket Tracking Modal */}
      <TicketLookupModal 
        isOpen={ticketModalOpen} 
        onClose={() => setTicketModalOpen(false)} 
      />

      {/* Role Login / Register Modal */}
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
