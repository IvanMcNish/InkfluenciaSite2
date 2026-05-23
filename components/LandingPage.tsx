import React, { useState, useEffect } from 'react';
import { APP_LANDING_LOGO_URL} from '../lib/supabaseClient';

interface LandingPageProps {
  isVisible: boolean;
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isVisible, onStart }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) setShouldRender(true);
    else {
      const timer = setTimeout(() => setShouldRender(false), 1000); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`absolute inset-0 z-50 flex flex-col bg-white/60 dark:bg-black/60 backdrop-blur-md cursor-pointer overflow-hidden transition-all duration-1000 ease-in-out ${!isVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      onClick={onStart}
    >
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4 pointer-events-none">
        
        {/* Main Brand Logo */}
        <div className="mb-8 relative group z-10 perspective-1000">
            {/* Expanded Blur Container for Safari clipping fix */}
            <div className="absolute -inset-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 will-change-[opacity]"></div>
            
            <img 
                src={`${APP_LANDING_LOGO_URL}?t=${new Date().getHours()}`}
                alt="Inkfluencia Brand" 
                className="relative w-72 h-72 md:w-[28rem] md:h-[28rem] object-contain animate-fade-in hover:scale-105 transition-transform duration-500 will-change-transform backface-visibility-hidden"
                style={{ transform: 'translate3d(0,0,0)' }} // Force GPU layer for Safari
            />
        </div>

        <div className="mb-4 inline-block relative z-20">
          <span className="py-1 px-3 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-sm font-bold tracking-wide">
            NUEVA COLECCIÓN 2026
          </span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black mb-4 tracking-tight text-gray-900 dark:text-white relative z-20">
          Viste tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400">Influencia</span>.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed relative z-20">
          Camisetas personalizadas DTF en Bucaramanga. Diseños únicos elaborados con algodón peruano, colores vibrantes y tecnología 3D. Personaliza tu estilo con Inkfluencia desde 1 unidad y resalta en todo Santander.
        </p>
      </div>
    </div>
  );
};
