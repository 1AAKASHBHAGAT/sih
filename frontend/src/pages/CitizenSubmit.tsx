import React, { useState, FormEvent } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Compass,
  Check,
  Zap,
  Cpu,
  Search,
  AlertTriangle,
  WifiOff
} from 'lucide-react';
import { submitProblem } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const JHARKHAND_DISTRICTS = [
  "Ranchi", "Dhanbad", "Bokaro", "Jamshedpur", "Hazaribagh", 
  "Dumka", "Deoghar", "Giridih", "Palamu", "Chaibasa", "Ramgarh", "Koderma"
];

const ROUTE_MAP: Record<string, string> = {
  "Water Management": "IIT (ISM) Dhanbad - Water Research Center",
  "Healthcare": "Central University of Jharkhand (CUJ) - Health Tech Hub",
  "Agriculture": "Birsa Agricultural University, Ranchi",
  "Education": "Ranchi University - Digital Innovation Lab",
  "Sanitation": "NIT Jamshedpur - Environmental Engineering Department",
  "Infrastructure & Energy": "BIT Mesra - Civil & Renewable Energy Center",
  "Environment & Forests": "NIT Jamshedpur - Environmental Engineering Department"
};

interface CitizenSubmitProps {
  onNavigateToUniversity?: () => void;
  onOpenTicketLookup?: () => void;
}

function CitizenSubmit({ onNavigateToUniversity, onOpenTicketLookup }: CitizenSubmitProps) {
  const { t } = useLanguage();

  const CATEGORIES = [
    { id: "Water Management", label: t('catWater'), icon: "💧" },
    { id: "Healthcare", label: t('catHealth'), icon: "🏥" },
    { id: "Agriculture", label: t('catAgri'), icon: "🌾" },
    { id: "Education", label: t('catEdu'), icon: "🎓" },
    { id: "Sanitation", label: t('catSanitation'), icon: "♻️" },
    { id: "Infrastructure & Energy", label: t('catInfra'), icon: "⚡" },
    { id: "Environment & Forests", label: t('catEnv'), icon: "🌲" }
  ];

  const SAMPLE_PRESETS = [
    {
      short_label: "Bokaro • Water Contamination",
      display_title: t('preset1Title'),
      title: t('preset1FullTitle'),
      description: t('preset1Desc'),
      user_category: "Water Management",
      district: "Bokaro",
      location: "Chas Village, Bokaro District",
      reporter_name: "Ramesh Kumar Mahato",
      contact_phone: "+91 94311 02931"
    },
    {
      short_label: "Ranchi • Soil Acidity",
      display_title: t('preset2Title'),
      title: t('preset2FullTitle'),
      description: t('preset2Desc'),
      user_category: "Agriculture",
      district: "Ranchi",
      location: "Kanke Block, Ranchi",
      reporter_name: "Sunita Munda",
      contact_phone: "+91 98351 44829"
    },
    {
      short_label: "Dumka • Maternal Healthcare",
      display_title: t('preset3Title'),
      title: t('preset3FullTitle'),
      description: t('preset3Desc'),
      user_category: "Healthcare",
      district: "Dumka",
      location: "Jama PHC, Dumka",
      reporter_name: "Dr. Rajeshwar Murmu",
      contact_phone: "+91 94301 99201"
    }
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    user_category: 'Water Management',
    location: '',
    district: 'Ranchi',
    latitude: 23.3441,
    longitude: 85.3096,
    reporter_name: '',
    contact_phone: '',
    image_url: ''
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [networkError, setNetworkError] = useState<string>('');
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [syncMessage, setSyncMessage] = useState<string>('');

  React.useEffect(() => {
    const checkOfflineQueue = () => {
      try {
        const q = JSON.parse(localStorage.getItem('setu_offline_queue') || '[]');
        setOfflineQueueCount(q.length);
      } catch (e) {
        setOfflineQueueCount(0);
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const q = JSON.parse(localStorage.getItem('setu_offline_queue') || '[]');
        if (q.length > 0) {
          setSyncMessage(`Network connection restored! Auto-syncing ${q.length} offline submission(s)...`);
          let syncedCount = 0;
          for (const item of q) {
            try {
              await submitProblem(item);
              syncedCount++;
            } catch (err) {
              console.error('Failed to auto-sync item:', item, err);
            }
          }
          localStorage.removeItem('setu_offline_queue');
          setOfflineQueueCount(0);
          setSyncMessage(`Successfully auto-synced ${syncedCount} offline submission(s) to the Government portal!`);
          setTimeout(() => setSyncMessage(''), 8000);
        }
      } catch (e) {
        console.error('Offline sync error:', e);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by browser. Using district center.');
      return;
    }
    setGeoStatus('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: `GPS Pin: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`
        }));
        setGeoStatus(`📍 GPS Locked (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
      },
      (_err) => {
        setGeoStatus('GPS Permission Denied. Please select district manually.');
      }
    );
  };

  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    setValidationError('');
    setNetworkError('');
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      description: preset.description,
      user_category: preset.user_category,
      district: preset.district,
      location: preset.location,
      reporter_name: preset.reporter_name,
      contact_phone: preset.contact_phone
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setNetworkError('');

    if (formData.title.trim().length < 3) {
      setValidationError('Title is too short. Please enter at least 3 characters.');
      return;
    }
    if (formData.description.trim().length < 10) {
      setValidationError('Description is too brief. Please enter at least 10 characters explaining the issue.');
      return;
    }

    setLoading(true);
    setResult(null);

    if (!navigator.onLine) {
      const offlineItem = {
        ...formData,
        offline_created_at: new Date().toISOString()
      };
      const existingQueue = JSON.parse(localStorage.getItem('setu_offline_queue') || '[]');
      existingQueue.push(offlineItem);
      localStorage.setItem('setu_offline_queue', JSON.stringify(existingQueue));
      setOfflineQueueCount(existingQueue.length);

      const mockOfflineResult = {
        ticket_code: `SIH-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title,
        description: formData.description,
        user_category: formData.user_category,
        ai_predicted_category: formData.user_category,
        ai_confidence: 0.90,
        assigned_university: ROUTE_MAP[formData.user_category] || "Ranchi University - Digital Innovation Lab",
        location: formData.location || "Ranchi",
        district: formData.district || "Ranchi",
        status: "Queued (Offline)",
        urgency_score: 7,
        reporter_name: formData.reporter_name || "Anonymous Citizen",
        is_offline_queued: true
      };
      setResult(mockOfflineResult);
      setLoading(false);
      return;
    }

    try {
      const res = await submitProblem(formData);
      setResult(res.data);
    } catch (err) {
      setNetworkError('Network Connection Error: Could not reach backend API server. Saved to local draft queue.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatedDomain = formData.user_category || "Water Management";
  const calculatedUniversity = ROUTE_MAP[calculatedDomain] || "Ranchi University - Digital Innovation Lab";
  const textLength = (formData.title || '').length + (formData.description || '').length;
  const estimatedUrgency = textLength > 200 ? 8.2 : textLength > 80 ? 6.5 : textLength > 0 ? 4.5 : null;

  return (
    <div className="w-full max-w-[1720px] mx-auto py-10 sm:py-16 px-4 sm:px-8 lg:px-12 flex flex-col gap-10 sm:gap-12">
      
      {/* PWA OFFLINE / AUTO-SYNC NOTIFICATION BANNER */}
      {(!isOnline || offlineQueueCount > 0 || syncMessage) && (
        <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 text-xs sm:text-sm font-medium shadow-lg transition-all ${
          !isOnline 
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-200' 
            : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            {!isOnline ? (
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
            ) : (
              <Zap className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
            )}
            <div>
              {!isOnline ? (
                <>
                  <span className="font-bold">Offline Mode Active:</span> Your app shell is operational. Submissions will be saved to your local offline queue ({offlineQueueCount} queued) and auto-synced upon reconnection.
                </>
              ) : syncMessage ? (
                <span>{syncMessage}</span>
              ) : (
                <>
                  <span className="font-bold">Network Connected:</span> All submission sync pipelines online. ({offlineQueueCount} queued items)
                </>
              )}
            </div>
          </div>
          {offlineQueueCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs shrink-0">
              {offlineQueueCount} Queued Offline
            </span>
          )}
        </div>
      )}

      {/* 1. HERO HEADER */}
      <header className="space-y-3 text-left border-b border-[#1e2d54]/80 pb-8 w-full">
        <div className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
          Government of Jharkhand · Department of Higher & Technical Education
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
          Community Challenge Submission & HEI Routing System
        </h1>

        <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-6xl">
          Report local civic or infrastructural issues across Jharkhand. Submissions are processed via automated AI domain classification and routed to regional university R&D centers for field evaluation.
        </p>
      </header>

      {/* 2. PROMINENT INLINE TICKET/STATUS TRACKING ENTRY POINT */}
      <section 
        aria-label="Ticket Tracking Shortcut"
        className="full-screen-card p-6 sm:p-8 bg-[#0e172e] border border-[#1e2d54] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl w-full"
      >
        <div className="space-y-1.5 text-left">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" aria-hidden="true" /> Track Existing Submission Status
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Enter your assigned Grievance ID (e.g., SIH-JH-1042) to inspect university triage status and project milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTicketLookup}
          aria-label="Open Grievance ID tracking dialog"
          className="btn-secondary py-3.5 px-7 text-xs sm:text-sm font-bold shrink-0 bg-[#080d1a] border-[#2a3b63]/80 hover:border-blue-500 text-slate-200 shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Track Grievance ID ➔
        </button>
      </section>

      {/* 3. DEMO SHORTCUTS */}
      <section 
        aria-label="Test Preset Scenarios"
        className="p-6 bg-[#0a1122]/90 border border-[#1e2d54] rounded-2xl flex flex-wrap items-center gap-4 text-xs sm:text-sm w-full shadow-lg"
      >
        <span className="text-slate-200 font-semibold flex items-center gap-2 shrink-0">
          <Zap className="w-4 h-4 text-blue-400" aria-hidden="true" /> Test Preset Scenarios:
        </span>
        <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Preset problem scenarios">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              aria-label={`Load preset scenario: ${preset.short_label}`}
              className="px-4.5 py-2.5 rounded-xl bg-[#0e172e] border border-[#2a3b63]/80 hover:border-blue-500 hover:text-white text-slate-200 font-medium transition-all text-xs sm:text-sm cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {preset.short_label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. BROADER 2-COLUMN BALANCED LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start w-full">
        
        {/* LEFT COLUMN: PRIMARY SUBMISSION FORM */}
        <main className="lg:col-span-7 full-screen-card p-8 sm:p-10 lg:p-12 shadow-2xl bg-[#0e172e] border border-[#1e2d54] w-full space-y-8">
          
          {/* Validation & Network Error Banners with ARIA Alert */}
          {validationError && (
            <div 
              role="alert" 
              aria-live="assertive" 
              className="p-4.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          {networkError && (
            <div 
              role="alert" 
              aria-live="assertive" 
              className="p-4.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-3"
            >
              <WifiOff className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{networkError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 w-full">
            
            {/* Challenge Title */}
            <div>
              <label 
                htmlFor="challenge-title" 
                className="block text-xs font-semibold tracking-wider text-slate-200 uppercase mb-2.5"
              >
                {t('challengeTitleLabel')} <span className="text-blue-400" aria-hidden="true">*</span>
              </label>
              <input
                id="challenge-title"
                type="text"
                className="form-input text-sm font-medium bg-[#080d1a] border-[#2a3b63]/80 focus:border-blue-500 py-3.5 px-4 rounded-xl text-white"
                placeholder={t('challengeTitlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                aria-required="true"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label 
                htmlFor="challenge-description" 
                className="block text-xs font-semibold tracking-wider text-slate-200 uppercase mb-2.5"
              >
                {t('descriptionLabel')} <span className="text-blue-400" aria-hidden="true">*</span>
              </label>
              <textarea
                id="challenge-description"
                rows={5}
                className="form-textarea text-xs sm:text-sm leading-relaxed bg-[#080d1a] border-[#2a3b63]/80 focus:border-blue-500 py-3.5 px-4 rounded-xl text-white"
                placeholder={t('descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                aria-required="true"
              />
            </div>

            {/* Primary Domain Category Selector (Accessible Radiogroup) */}
            <fieldset className="space-y-3">
              <legend 
                id="domain-category-legend" 
                className="block text-xs font-semibold tracking-wider text-slate-200 uppercase mb-3"
              >
                {t('domainLabel')}
              </legend>
              <div 
                role="radiogroup" 
                aria-labelledby="domain-category-legend"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full"
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.user_category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setFormData({ ...formData, user_category: cat.id })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setFormData({ ...formData, user_category: cat.id });
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-[#080d1a] border-[#2a3b63]/80 text-slate-200 hover:border-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base shrink-0" aria-hidden="true">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-white ml-auto shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* District & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6.5 w-full">
              <div>
                <label 
                  htmlFor="district-select" 
                  className="block text-xs font-semibold tracking-wider text-slate-200 uppercase mb-2"
                >
                  {t('districtLabel')}
                </label>
                <select
                  id="district-select"
                  className="form-select text-xs sm:text-sm font-semibold bg-[#080d1a] border-[#2a3b63]/80 focus:border-blue-500 py-3.5 px-4 rounded-xl text-white"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                >
                  {JHARKHAND_DISTRICTS.map(dist => (
                    <option key={dist} value={dist} className="bg-slate-900 text-slate-200">{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  htmlFor="location-input" 
                  className="block text-xs font-semibold tracking-wider text-slate-200 uppercase mb-2"
                >
                  {t('locationLabel')} <span className="text-blue-400" aria-hidden="true">*</span>
                </label>
                <div className="flex gap-2.5">
                  <input
                    id="location-input"
                    type="text"
                    className="form-input text-xs sm:text-sm flex-1 bg-[#080d1a] border-[#2a3b63]/80 focus:border-blue-500 py-3.5 px-4 rounded-xl text-white"
                    placeholder={t('locationPlaceholder')}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    aria-label="Detect current GPS location coordinates"
                    className="btn-secondary py-3.5 px-4 shrink-0 text-xs font-bold bg-[#080d1a] border-[#2a3b63]/80 hover:border-blue-500 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-400"
                    title="Detect GPS location"
                  >
                    <Compass className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <span className="hidden sm:inline">GPS</span>
                  </button>
                </div>
                {geoStatus && (
                  <p className="text-[11px] text-blue-400 font-semibold mt-2" role="status">{geoStatus}</p>
                )}
              </div>
            </div>

            {/* Reporter Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6.5 pt-6 border-t border-[#1e2d54]/80 w-full">
              <div>
                <label 
                  htmlFor="reporter-name" 
                  className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2"
                >
                  {t('nameLabel')}
                </label>
                <input
                  id="reporter-name"
                  type="text"
                  className="form-input text-xs sm:text-sm bg-[#080d1a] border-[#2a3b63]/80 focus:border-blue-500 py-3.5 px-4 rounded-xl text-white"
                  placeholder={t('namePlaceholder')}
                  value={formData.reporter_name}
                  onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                />
              </div>
              <div>
                <label 
                  htmlFor="reporter-phone" 
                  className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2"
                >
                  {t('phoneLabel')}
                </label>
                <input
                  id="reporter-phone"
                  type="text"
                  className="form-input text-xs sm:text-sm bg-[#080d1a] border-[#2a3b63]/80 focus:border-blue-500 py-3.5 px-4 rounded-xl text-white"
                  placeholder={t('phonePlaceholder')}
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            {/* Primary Action Submit Button */}
            <button
              type="submit"
              className="w-full btn-primary py-4.5 text-base font-bold justify-center rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl cursor-pointer mt-4 focus-visible:ring-2 focus-visible:ring-blue-400"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 animate-spin text-white" aria-hidden="true" /> Processing Submission...
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  Submit Challenge to Routing Engine <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </span>
              )}
            </button>

          </form>
        </main>

        {/* RIGHT COLUMN: PERSISTENT REAL-TIME AI ROUTING PREVIEW PANEL (ARIA LIVE REGION) */}
        <aside 
          aria-live="polite" 
          aria-atomic="true" 
          aria-label="Real-time AI Classification Preview"
          className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 w-full"
        >
          <div className="full-screen-card p-8 sm:p-10 bg-[#0e172e] border border-[#1e2d54] space-y-7 shadow-2xl w-full">
            
            <div className="flex items-center justify-between border-b border-[#1e2d54] pb-5">
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" aria-hidden="true" /> AI Classification Matrix
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                LIVE STATUS
              </span>
            </div>

            <div className="space-y-6 text-xs sm:text-sm">
              
              {/* Detected Domain */}
              <div>
                <span className="text-slate-300 uppercase text-[10px] sm:text-xs font-bold tracking-wider block mb-2">
                  Predicted Domain Category
                </span>
                <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2d54] text-white font-bold flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                  <span>{calculatedDomain}</span>
                </div>
              </div>

              {/* Likely Routed University */}
              <div>
                <span className="text-slate-300 uppercase text-[10px] sm:text-xs font-bold tracking-wider block mb-2">
                  Assigned HEI Nodal Center
                </span>
                <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2d54] text-slate-100 font-semibold flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-relaxed">{calculatedUniversity}</span>
                </div>
              </div>

              {/* Estimated Urgency Score */}
              <div>
                <span className="text-slate-300 uppercase text-[10px] sm:text-xs font-bold tracking-wider block mb-2">
                  Urgency Rating Index
                </span>
                <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2d54] flex items-center justify-between">
                  <span className="text-slate-200 font-medium">Calculated Priority</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {estimatedUrgency ? `${estimatedUrgency} / 10` : '—'}
                  </span>
                </div>
              </div>

              {/* Location Pin Preview */}
              <div>
                <span className="text-slate-300 uppercase text-[10px] sm:text-xs font-bold tracking-wider block mb-2">
                  Target District Coordinates
                </span>
                <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2d54] text-slate-200 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                  <span className="truncate">{formData.location || `${formData.district} District`}</span>
                </div>
              </div>

            </div>

          </div>
        </aside>

      </div>

      {/* OFFICIAL ACKNOWLEDGMENT RECEIPT MODAL */}
      {result && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="receipt-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
        >
          <div className="full-screen-card max-w-lg w-full p-8 sm:p-10 border border-blue-500/40 shadow-2xl relative bg-[#0e172e] space-y-5">
            
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="border-b border-[#1e2d54] pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Department of Higher & Technical Education · Government of Jharkhand
              </span>
              <h3 id="receipt-modal-title" className="text-xl font-bold text-white leading-snug">
                Official Acknowledgment of Receipt
              </h3>
            </div>

            {/* Duplicate Flag Banner if detected */}
            {result.is_duplicate && (
              <div 
                role="alert" 
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold space-y-1.5"
              >
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Possible Duplicate Challenge Detected</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Matches existing district submission <span className="font-mono text-white font-bold">{result.duplicate_of_ticket}</span>. Flagged for university cross-reference.
                </p>
              </div>
            )}

            <div className="space-y-3.5 bg-[#080d1a] p-5 rounded-xl border border-[#1e2d54] text-xs font-mono">
              <div className="flex items-center justify-between border-b border-[#1e2d54] pb-2.5">
                <span className="text-slate-300">Grievance ID:</span>
                <span className="font-bold text-blue-400 text-sm tracking-wider">{result.ticket_code}</span>
              </div>

              <div className="flex items-center justify-between border-b border-[#1e2d54] pb-2.5">
                <span className="text-slate-300">Domain Category:</span>
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  {result.domain || result.ai_predicted_category}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#1e2d54] pb-2.5">
                <span className="text-slate-300">Urgency Level:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5 ${
                  (result.calculated_priority ?? result.urgency_score ?? 5) >= 8 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : (result.calculated_priority ?? result.urgency_score ?? 5) >= 6 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    (result.calculated_priority ?? result.urgency_score ?? 5) >= 8 ? 'bg-rose-400 animate-pulse' : (result.calculated_priority ?? result.urgency_score ?? 5) >= 6 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  {result.calculated_priority || result.urgency_score ? `Priority ${result.calculated_priority || result.urgency_score}/10` : 'Standard Priority'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#1e2d54] pb-2.5">
                <span className="text-slate-300">Assigned HEI Node:</span>
                <span className="font-bold text-slate-100 truncate max-w-[220px]" title={result.assigned_university}>
                  {result.assigned_university}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Next Action:</span>
                <span className="text-slate-200">Initial university triage within 72 hours</span>
              </div>
            </div>

            <div className="flex gap-4 pt-3">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn-secondary flex-1 justify-center text-xs py-3.5 font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Submit Another Issue
              </button>

              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  if (onNavigateToUniversity) onNavigateToUniversity();
                }}
                className="btn-primary flex-1 justify-center text-xs py-3.5 font-bold bg-blue-600 hover:bg-blue-500 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                View in University Queue
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CitizenSubmit;
