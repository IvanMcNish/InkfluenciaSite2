import React from 'react';
import { Sun, Moon, ShoppingBag, ArrowLeft, LayoutDashboard, Grid, Truck, Instagram } from 'lucide-react';
import { ViewState } from '../types';
import { APP_LOGO_URL } from '../lib/supabaseClient';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentView: ViewState;
  navigate: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode, currentView, navigate }) => {
  return (
    <nav className="w-full py-4 px-6 flex justify-between items-center sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 print:hidden">
      <div className="flex items-center gap-4">
        {currentView !== 'landing' && (
          <button 
            onClick={() => navigate('landing')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div 
          onClick={() => navigate('landing')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <img 
            // Append timestamp to force refresh if cached, though cleaner in prod to just use URL
            src={`${APP_LOGO_URL}?t=${new Date().getHours()}`} 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none'; 
            }}
            alt="Logo" 
            className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" 
          />
          <span className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-500 hover:animate-gradient-x bg-[length:200%_auto]">
            INKFLUENCIA
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('community')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
            currentView === 'community' 
              ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
          }`}
          title="Comunidad"
        >
          <Instagram className="w-5 h-5" />
          <span className="hidden sm:inline">Comunidad</span>
        </button>

        <button
          onClick={() => navigate('track-order')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
            currentView === 'track-order' 
              ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
          }`}
          title="Rastrear Pedido"
        >
          <Truck className="w-5 h-5" />
          <span className="hidden sm:inline">Rastrear</span>
        </button>

        <button
          onClick={() => navigate('gallery')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
            currentView === 'gallery' 
              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
          }`}
          title="Ver Galería"
        >
          <Grid className="w-5 h-5" />
          <span className="hidden sm:inline">Galería</span>
        </button>

        <button
          onClick={() => navigate('admin')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
            currentView === 'admin' 
              ? 'bg-gray-100 dark:bg-gray-800 text-pink-600' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
          }`}
          title="Panel Admin"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="hidden sm:inline">Admin</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
        
        {currentView !== 'customizer' && currentView !== 'checkout' && currentView !== 'admin' && currentView !== 'designer' && (
          <button
            onClick={() => navigate('customizer')}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-5 py-2.5 rounded-full transition-all font-bold shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            Crear Diseño
          </button>
        )}
      </div>
    </nav>
  );
};