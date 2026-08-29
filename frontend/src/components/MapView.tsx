import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink } from 'lucide-react';

try {
  if (L && (L as any).Icon && (L as any).Icon.Default && (L as any).Icon.Default.prototype) {
    delete (L as any).Icon.Default.prototype._getIconUrl;
  }
} catch (e) {
  // Safe fallback if Leaflet icon prototype is missing
}

const DOMAIN_COLORS: Record<string, string> = {
  "Water Management": "#2563eb",
  "Healthcare": "#e11d48",
  "Agriculture": "#16a34a",
  "Education": "#9333ea",
  "Sanitation": "#d97706",
  "Infrastructure & Energy": "#0284c7",
  "Environment & Forests": "#059669"
};

const HEI_NODES = [
  { name: "IIT (ISM) Dhanbad", lat: 23.8143, lng: 86.4412, category: "Water & Mineral Tech" },
  { name: "Birsa Agricultural University, Ranchi", lat: 23.4347, lng: 85.3218, category: "Agri Tech" },
  { name: "Central University of Jharkhand (CUJ)", lat: 23.3850, lng: 85.3400, category: "Health Tech" },
  { name: "Ranchi University", lat: 23.3600, lng: 85.3200, category: "Digital Innovation" },
  { name: "NIT Jamshedpur", lat: 22.7770, lng: 86.1441, category: "Environmental Eng" },
  { name: "BIT Mesra", lat: 23.4123, lng: 85.4399, category: "Civil & Energy" }
];

function createProblemMarker(category: string) {
  const color = DOMAIN_COLORS[category] || '#2563eb';
  const customHtml = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
    ">
      ●
    </div>
  `;
  return L.divIcon({
    html: customHtml,
    className: 'custom-leaflet-problem-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

function createHeiMarker() {
  const customHtml = `
    <div style="
      background-color: #2563eb;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(37,99,235,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: bold;
      font-size: 13px;
    ">
      🏛️
    </div>
  `;
  return L.divIcon({
    html: customHtml,
    className: 'custom-leaflet-hei-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

interface MapViewProps {
  problems?: any[];
  height?: string;
  onSelectProblem?: (prob: any) => void;
}

function MapView({ problems = [], height = "480px", onSelectProblem }: MapViewProps) {
  // Center of Jharkhand (Ranchi / State geographic center)
  const defaultCenter: [number, number] = [23.6102, 85.2799];
  const defaultZoom = 8;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md w-full" style={{ height }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      >
        {/* OpenStreetMap Standard Tiles (No Watermarks, Fast & Clean) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* HEI Nodal Markers */}
        {HEI_NODES.map((hei, idx) => (
          <Marker
            key={`hei-${idx}`}
            position={[hei.lat, hei.lng]}
            icon={createHeiMarker()}
          >
            <Popup>
              <div className="p-1 min-w-[200px] text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  HEI Nodal R&D Center
                </span>
                <h4 className="font-bold text-sm text-slate-900 mb-1">{hei.name}</h4>
                <span className="text-blue-600 font-semibold">{hei.category}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Submitted Problem Markers */}
        {problems.map((prob) => {
          const lat = prob.latitude || prob.location_lat;
          const lng = prob.longitude || prob.location_lng;
          if (!lat || !lng) return null;
          const domainName = prob.domain || prob.ai_predicted_category || 'Infrastructure & Energy';
          const icon = createProblemMarker(domainName);
          const univ = prob.assigned_university || 'Nodal University';

          return (
            <Marker 
              key={prob.id || prob.ticket_code} 
              position={[lat, lng]} 
              icon={icon}
            >
              <Popup>
                <div className="p-1 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-blue-600">
                      Grievance ID: {prob.ticket_code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {prob.district}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1 leading-snug">
                    {prob.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {prob.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">AI Domain:</span>
                      <span className="font-semibold text-blue-600">{domainName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Routed HEI:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={univ}>
                        {univ.split('-')[0]}
                      </span>
                    </div>
                  </div>

                  {onSelectProblem && (
                    <button
                      type="button"
                      onClick={() => onSelectProblem(prob)}
                      className="w-full mt-3 btn-primary text-xs py-1.5 justify-center bg-blue-600 hover:bg-blue-700"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl z-[1000] text-xs space-y-2.5 max-w-[240px]">
        <p className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5">
          Spatial Map Legend
        </p>
        <div className="space-y-2 text-[11px] text-slate-700">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shrink-0 border border-white"></span>
            <span className="font-medium text-slate-700">Water Management</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shrink-0 border border-white"></span>
            <span className="font-medium text-slate-700">Healthcare</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shrink-0 border border-white"></span>
            <span className="font-medium text-slate-700">Agriculture</span>
          </div>
          <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
            <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block border border-white shrink-0 text-[10px] text-center leading-3 text-white">🏛️</span>
            <span className="font-bold text-blue-700">HEI R&D Centers</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;
