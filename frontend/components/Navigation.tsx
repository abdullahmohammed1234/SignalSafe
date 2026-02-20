'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '' },
    { href: '/dashboard/strategic', label: 'Strategic', icon: '' },
    { href: '/dashboard/analyst', label: 'Analyst', icon: '' },
    { href: '/dashboard/autonomy', label: 'Autonomy', icon: '' },
    { href: '/dashboard/simulation', label: 'Policy Lab', icon: '' },
    { href: '/dashboard/forecast', label: 'Forecast', icon: '' },
    { href: '/dashboard/portfolio', label: 'Portfolio', icon: '' },
    { href: '/dashboard/audit', label: 'Audit', icon: '' },
    { href: '/dashboard/agents', label: 'Agents', icon: '' },
    { href: '/dashboard/system', label: 'System', icon: '' },
    { href: '/dashboard/replay', label: 'Replay', icon: '' },
    { href: '/dashboard/insights', label: 'Insights', icon: '' },
  ];
  
  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-indigo-500/30 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-lg">🔒</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">SignalSafe</h1>
            <p className="text-xs text-gray-400 -mt-1">Intelligence Platform</p>
          </div>
        </div>
        
        {/* Navigation Tabs - Scrollable for smaller screens */}
        <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-xl overflow-x-auto max-w-xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}
                `}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Status Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400 font-medium">System Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
