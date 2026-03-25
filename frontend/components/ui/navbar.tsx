"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, LayoutDashboard, Trophy, Upload, LogIn, Menu, X } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/hackathons', label: 'Hackathons', icon: Trophy },
    { href: '/upload', label: 'Upload', icon: Upload },
  ];

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
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
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
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg shadow-purple-500/10"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/25 bg-black/90 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
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
            <div className="border-t border-white/25 pt-3 mt-3 space-y-1">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-gray-400 hover:text-white">
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-semibold text-purple-400">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
