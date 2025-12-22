import React from 'react';
import { Sun, Moon, ShoppingBag, ArrowLeft, LayoutDashboard, Grid, Truck, Instagram, MessageCircle } from 'lucide-react';
import { ViewState } from '../types';
import { APP_LOGO_URL, APP_DESKTOP_LOGO_URL } from '../lib/supabaseClient';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentView: ViewState;
  navigate: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode, currentView, navigate }) => {
  return (
    <nav className="w-full py-3 md:py-4 px-4 md:px-6 flex justify-between items-center sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 print:hidden transition-all">
      <div className="flex items-center gap-2 md:gap-4">
        {currentView !== 'landing' && (
          <button 
            onClick={() => navigate('landing')}
            className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div 
          onClick={() => navigate('landing')}
          className="flex items-center cursor-pointer select-none group"
        >
          {/* Mobile Logo (Square/Icon) - Visible on small screens */}
          <img 
            src={`${APP_LOGO_URL}?t=${new Date().getHours()}`} 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none'; 
            }}
            alt="Inkfluencia" 
            className="block md:hidden w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" 
          />

          {/* Desktop Logo (Full/Landscape) - Visible on medium screens and up */}
          <img 
            src={`${APP_DESKTOP_LOGO_URL}?t=${new Date().getHours()}`} 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none'; 
            }}
            alt="Inkfluencia" 
            className="hidden md:block h-12 w-auto object-contain drop-shadow-sm transition-transform group-hover:scale-105" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Navigation Links - Hidden on very small screens or collapsed into menu in a real full app */}
        <div className="hidden lg:flex items-center gap-1">
            <button
            onClick={() => navigate('community')}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                currentView === 'community' 
                ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
            }`}
            title="Comunidad"
            >
            <Instagram className="w-4 h-4" />
            <span>Comunidad</span>
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
            <Truck className="w-4 h-4" />
            <span>Rastrear</span>
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
            <Grid className="w-4 h-4" />
            <span>Galería</span>
            </button>

            <button
            onClick={() => navigate('contact')}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                currentView === 'contact' 
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
            }`}
            title="Contacto"
            >
            <MessageCircle className="w-4 h-4" />
            <span>Contacto</span>
            </button>
        </div>

        {/* Mobile Icons (Simplified) */}
        <div className="lg:hidden flex items-center gap-1">
             <button onClick={() => navigate('community')} className="p-2 text-gray-500"><Instagram className="w-5 h-5"/></button>
             <button onClick={() => navigate('gallery')} className="p-2 text-gray-500"><Grid className="w-5 h-5"/></button>
             <button onClick={() => navigate('contact')} className="p-2 text-gray-500"><MessageCircle className="w-5 h-5"/></button>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

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
            <span className="hidden lg:inline">Crear Diseño</span>
            <span className="lg:hidden">Crear</span>
          </button>
        )}
      </div>
    </nav>
  );
};