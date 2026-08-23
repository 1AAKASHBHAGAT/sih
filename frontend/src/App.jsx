import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TicketLookupModal from './components/TicketLookupModal';
import LoginModal from './components/LoginModal';
import PresenterBar from './components/PresenterBar';
import ProtectedRoute from './components/ProtectedRoute';
import CitizenSubmit from './pages/CitizenSubmit';
import UniversityQueue from './pages/UniversityQueue';
import AdminDashboard from './pages/AdminDashboard';
import IndustryCatalog from './pages/IndustryCatalog';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('submit');
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState(null);

  const handleOpenLogin = (role = null) => {
    setTargetLoginRole(role);
    setLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col portal-bg text-slate-100 overflow-x-hidden">
      
      {/* Feature Gated Demo Presenter Mode Toolbar */}
      <PresenterBar />

      {/* Header & Role Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenTicketLookup={() => setTicketModalOpen(true)}
        onOpenLogin={handleOpenLogin}
      />

      {/* Main Content View Container */}
      <main className="flex-1 w-full py-2">
        {activeTab === 'submit' && (
          <CitizenSubmit 
            onNavigateToUniversity={() => setActiveTab('university')}
            onOpenTicketLookup={() => setTicketModalOpen(true)}
          />
        )}

        {activeTab === 'university' && (
          <ProtectedRoute
            allowedRoles={['university_admin', 'government']}
            pageTitle="University Collaboration Workspace"
            onOpenLogin={handleOpenLogin}
          >
            <UniversityQueue />
          </ProtectedRoute>
        )}

        {activeTab === 'analytics' && (
          <ProtectedRoute
            allowedRoles={['government']}
            pageTitle="Gov Executive Dashboard"
            onOpenLogin={handleOpenLogin}
          >
            <AdminDashboard />
          </ProtectedRoute>
        )}

        {activeTab === 'industry' && (
          <ProtectedRoute
            allowedRoles={['industry', 'government']}
            pageTitle="Industry CSR Partnership Hub"
            onOpenLogin={handleOpenLogin}
          >
            <IndustryCatalog />
          </ProtectedRoute>
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

      {/* Formal Institutional Footer */}
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
