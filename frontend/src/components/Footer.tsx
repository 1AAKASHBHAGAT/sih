import React from 'react';

function Footer() {
  return (
    <footer className="w-full border-t border-[#1e2d54] bg-[#050914] mt-20 sm:mt-28 relative z-10">
      {/* Subtle Tri-Color Top Accent Bar */}
      <div className="gov-tricolor-bar opacity-80" aria-hidden="true"></div>

      <div className="max-w-[1720px] mx-auto py-10 px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-300">
        
        {/* Left attribution */}
        <div className="space-y-1 text-center md:text-left">
          <p className="font-bold text-slate-100 text-sm sm:text-base">
            Department of Higher & Technical Education, Government of Jharkhand
          </p>
          <p className="text-xs text-slate-300">
            Official Societal Innovation & Nodal HEI Routing Portal (Problem Statement 26043)
          </p>
        </div>

        {/* Right metadata & accessibility */}
        <div className="space-y-1 text-center md:text-right text-xs">
          <p className="font-mono font-bold text-blue-400">
            System Version 2.4.0 · Last Updated August 2026
          </p>
          <p className="text-slate-300">
            NEP 2020 Social Innovation Framework · Accessibility Standards Compliant
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
