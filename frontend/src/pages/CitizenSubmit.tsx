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
    { id: "Water Management", label: t('catWater') || "Water", icon: "💧" },
    { id: "Healthcare", label: t('catHealth') || "Healthcare", icon: "🏥" },
    { id: "Agriculture", label: t('catAgri') || "Agriculture", icon: "🌾" },
    { id: "Education", label: t('catEdu') || "Education", icon: "🎓" },
    { id: "Sanitation", label: t('catSanitation') || "Sanitation", icon: "♻️" },
    { id: "Infrastructure & Energy", label: t('catInfra') || "Infra & Energy", icon: "⚡" },
    { id: "Environment & Forests", label: t('catEnv') || "Environment", icon: "🌲" }
  ];

  const SAMPLE_PRESETS = [
    {
      short_label: "Bokaro • Water Contamination",
      title: "High Turbidity and Arsenic Contamination in Chas Village Drinking Water",
      description: "Severe drinking water supply contamination affecting over 4,500 residents. Tube-wells supplying reddish turbid water causing skin rashes and gastrointestinal illnesses.",
      user_category: "Water Management",
      district: "Bokaro",
      location: "Chas Village, Bokaro District",
      reporter_name: "Ramesh Kumar Mahato",
      contact_phone: "+91 94311 02931"
    },
    {
      short_label: "Ranchi • Soil Acidity",
      title: "Soil Acidity and Micronutrient Depletion Affecting Crop Yield",
      description: "Agricultural fields suffering high soil acidity (pH 4.8) leading to 40% reduction in paddy harvest across 12 farming hamlets.",
      user_category: "Agriculture",
      district: "Ranchi",
      location: "Kanke Block, Ranchi",
      reporter_name: "Sunita Munda",
      contact_phone: "+91 98351 44829"
    },
    {
      short_label: "Dumka • Maternal Healthcare",
      title: "Lack of Portable Diagnostic Kits in Remote Primary Health Center",
      description: "Primary Health Center lacks functional hemoglobin diagnostic strips and prenatal monitoring equipment for tribal expectant mothers.",
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
          setSyncMessage(`Connection restored! Auto-syncing ${q.length} offline submission(s)...`);
          let syncedCount = 0;
          for (const item of q) {
            try {
              await submitProblem(item);
              syncedCount++;
            } catch (err) {
              console.error('Auto-sync error:', err);
            }
          }
          localStorage.removeItem('setu_offline_queue');
          setOfflineQueueCount(0);
          setSyncMessage(`Synced ${syncedCount} offline submission(s) successfully!`);
          setTimeout(() => setSyncMessage(''), 6000);
        }
      } catch (e) {
        console.error('Offline sync failed:', e);
      }
    };

    const handleOffline = () => setIsOnline(false);

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
      setGeoStatus('Geolocation not supported by browser.');
      return;
    }
    setGeoStatus('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: `GPS: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`
        }));
        setGeoStatus(`📍 GPS Locked (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
      },
      () => {
        setGeoStatus('GPS access denied. Select district manually.');
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
      setValidationError('Please enter a descriptive title (at least 3 characters).');
      return;
    }
    if (formData.description.trim().length < 10) {
      setValidationError('Please describe the issue in detail (at least 10 characters).');
      return;
    }

    setLoading(true);
    setResult(null);

    if (!navigator.onLine) {
      const offlineItem = { ...formData, offline_created_at: new Date().toISOString() };
      const queue = JSON.parse(localStorage.getItem('setu_offline_queue') || '[]');
      queue.push(offlineItem);
      localStorage.setItem('setu_offline_queue', JSON.stringify(queue));
      setOfflineQueueCount(queue.length);

      setResult({
        ticket_code: `SIH-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title,
        description: formData.description,
        user_category: formData.user_category,
        ai_predicted_category: formData.user_category,
        assigned_university: ROUTE_MAP[formData.user_category] || "Ranchi University",
        location: formData.location || "Ranchi",
        district: formData.district || "Ranchi",
        status: "Queued (Offline)",
        urgency_score: 7,
        reporter_name: formData.reporter_name || "Citizen"
      });
      setLoading(false);
      return;
    }

    try {
      const res = await submitProblem(formData);
      setResult(res.data);
    } catch (err) {
      setNetworkError('Could not connect to backend API server. Your problem has been queued locally.');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      
      {/* Offline Status Alert */}
      {(!isOnline || offlineQueueCount > 0 || syncMessage) && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-medium ${
          !isOnline 
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' 
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {!isOnline ? <WifiOff className="w-4 h-4 text-amber-400 shrink-0" /> : <Zap className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>
              {!isOnline 
                ? `Offline Mode Active — ${offlineQueueCount} submission(s) queued for auto-sync.` 
                : syncMessage || `Network Connected. System synchronized.`}
            </span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> AI-Powered Challenge Routing
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          Crowdsource Societal Challenges & Route to HEI R&D
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
          Submit civic, agricultural, healthcare, or environmental problems. Our AI classifier automatically processes urgency, assigns grievance IDs, and routes challenges to state nodal university innovation labs.
        </p>
      </div>

      {/* Quick Test Presets & Track Ticket */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0b1329] border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
            <Zap className="w-3.5 h-3.5 text-blue-400" /> Presets:
          </span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="px-3 py-1.5 rounded-lg bg-[#0f172a] border border-slate-700/60 text-slate-300 hover:text-white hover:border-blue-500 text-xs transition cursor-pointer"
            >
              {preset.short_label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenTicketLookup}
          className="btn-secondary text-xs py-2 px-4 bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white shrink-0"
        >
          <Search className="w-3.5 h-3.5" /> Track Ticket Code
        </button>
      </div>

      {/* Main Grid: Form + Realtime AI Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Submission Form */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 space-y-6">
          
          {validationError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {networkError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{networkError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Challenge Title <span className="text-blue-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                className="form-input"
                placeholder="e.g. High Turbidity and Arsenic Contamination in Drinking Water"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Detailed Description & Community Impact <span className="text-blue-400">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                className="form-textarea leading-relaxed text-xs sm:text-sm"
                placeholder="Describe the issue, affected population, duration, and urgency..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Category Radios */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                Sector Domain Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.user_category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, user_category: cat.id })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30' 
                          : 'bg-[#0b1329] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* District & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="district" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  District
                </label>
                <select
                  id="district"
                  className="form-select"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                >
                  {JHARKHAND_DISTRICTS.map(d => (
                    <option key={d} value={d} className="bg-slate-900 text-slate-200">{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Location / Village <span className="text-blue-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="location"
                    type="text"
                    className="form-input flex-1"
                    placeholder="e.g. Chas Village, Block 4"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="btn-secondary py-2 px-3 text-xs bg-[#0b1329] border-slate-800 text-slate-300 hover:text-white shrink-0"
                    title="Detect GPS Location"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
                {geoStatus && <p className="text-[11px] text-blue-400 mt-1 font-medium">{geoStatus}</p>}
              </div>
            </div>

            {/* Reporter Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="reporter_name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Reporter Name
                </label>
                <input
                  id="reporter_name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.reporter_name}
                  onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="contact_phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  id="contact_phone"
                  type="text"
                  className="form-input"
                  placeholder="+91 94311 XXXXX"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" /> Processing AI Routing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Submit Challenge to Routing Engine <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

          </form>
        </div>

        {/* Real-time AI Preview Sidebar */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" /> AI Classification Matrix
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              READY
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-1.5">
                Target Domain Category
              </span>
              <div className="p-3 rounded-xl bg-[#0b1329] border border-slate-800 text-white font-semibold flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{calculatedDomain}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-1.5">
                Assigned University Nodal Center
              </span>
              <div className="p-3 rounded-xl bg-[#0b1329] border border-slate-800 text-slate-200 font-medium flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{calculatedUniversity}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-1.5">
                Estimated Priority Rating
              </span>
              <div className="p-3 rounded-xl bg-[#0b1329] border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-slate-300 font-sans">Priority Score</span>
                <span className="font-bold text-blue-400 text-sm">
                  {estimatedUrgency ? `${estimatedUrgency} / 10` : '—'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-1.5">
                Target District Pin
              </span>
              <div className="p-3 rounded-xl bg-[#0b1329] border border-slate-800 text-slate-300 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{formData.location || `${formData.district} District`}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Acknowledgment Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 space-y-4 relative bg-[#0f172a] border-blue-500/40">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Govt. of Jharkhand • HEI Nodal Portal</span>
              <h3 className="text-lg font-bold text-white mt-1">Official Submission Receipt</h3>
            </div>

            <div className="space-y-2.5 bg-[#0b1329] p-4 rounded-xl border border-slate-800 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Grievance Code:</span>
                <span className="font-bold text-blue-400">{result.ticket_code}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-slate-200">{result.domain || result.ai_predicted_category}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assigned HEI:</span>
                <span className="font-bold text-slate-200 truncate max-w-[180px]">{result.assigned_university}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">Assigned to University</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn-secondary flex-1 text-xs py-2.5 font-bold justify-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  if (onNavigateToUniversity) onNavigateToUniversity();
                }}
                className="btn-primary flex-1 text-xs py-2.5 font-bold bg-blue-600 hover:bg-blue-500 justify-center"
              >
                View Queue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CitizenSubmit;
