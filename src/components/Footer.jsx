import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Globe, Send, Camera, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-brand-card-dark/40 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-sport-green p-2 rounded-xl text-white shadow-md glow-green">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-850 dark:text-white">
              Sportify
            </span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your ultimate multi-sport ground booking platform. Discover venues, make instant real-time reservations, and play hassle-free.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a href="#" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-sport-green dark:hover:text-sport-green transition-colors" aria-label="Social Link">
              <Send className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-sport-green dark:hover:text-sport-green transition-colors" aria-label="Social Link">
              <Camera className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-sport-green dark:hover:text-sport-green transition-colors" aria-label="Social Link">
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/explore" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Explore Venues</Link>
            </li>
            <li>
              <Link to="/categories" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Sports Categories</Link>
            </li>
            <li>
              <Link to="/login" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Sign In</Link>
            </li>
            <li>
              <Link to="/register" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Register Account</Link>
            </li>
          </ul>
        </div>

        {/* Popular Sports */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Popular Sports</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/explore?sport=Football" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Football Turfs</Link>
            </li>
            <li>
              <Link to="/explore?sport=Cricket" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Box Cricket</Link>
            </li>
            <li>
              <Link to="/explore?sport=Badminton" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Badminton Courts</Link>
            </li>
            <li>
              <Link to="/explore?sport=Basketball" className="text-slate-500 dark:text-slate-400 hover:text-sport-green transition-colors">Basketball Arenas</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Contact Info</h3>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Mail className="h-4 w-4 text-sport-green" />
            <span>support@sportify.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Phone className="h-4 w-4 text-sport-green" />
            <span>+91 99000 88000</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4 text-sport-green" />
            <span>Stadium Road, Khel Nagar, India</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800/80 mt-8 pt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} Sportify. All rights reserved.
      </div>
    </footer>
  );
}
