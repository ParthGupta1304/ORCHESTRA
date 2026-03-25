"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, LayoutDashboard, Trophy, Upload, Menu, X } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; picture?: string } | null>(null);

  React.useEffect(() => {
    const userData = localStorage.getItem('orchestra_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error(e);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('orchestra_token');
    localStorage.removeItem('orchestra_user');
    setUser(null);
    window.location.href = '/login';
  };

  const allLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { href: '/hackathons', label: 'Hackathons', icon: Trophy, requiresAuth: true },
    { href: '/upload', label: 'Upload', icon: Upload, requiresAuth: true },
  ];

  const visibleLinks = allLinks.filter(link => !link.requiresAuth || user);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  if (pathname === '/') return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/25 bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Orchestra</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-1">
            {visibleLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(href)
                    ? 'bg-purple-500/15 text-purple-300 shadow-inner'
                    : 'text-gray-400 hover:text-white hover:bg-white/25'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.picture ? (
                    <img src={user.picture} alt="Profile" className="w-7 h-7 rounded-full border border-white/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/20">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-200">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors border border-white/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Judge Login
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-400 border border-white/10 rounded-lg"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/25 bg-black/90 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {visibleLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(href)
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/25'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {!user && (
              <div className="border-t border-white/25 pt-3 mt-3 space-y-1">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-gray-400 hover:text-white">
                  Judge Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
