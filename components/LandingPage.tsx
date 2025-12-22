import React from 'react';
import { Palette, Box, Sparkles, Grid } from 'lucide-react';
import { APP_LOGO_URL } from '../lib/supabaseClient';

interface LandingPageProps {
  onStart: () => void;
  onViewGallery: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onViewGallery }) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 md:py-20 bg-gradient-to-b from-transparent to-pink-50 dark:to-gray-900/50">
        
        {/* Main Brand Logo */}
        <div className="mb-8 relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img 
                src={`${APP_LOGO_URL}?t=${new Date().getHours()}`}
                alt="Inkfluencia Brand" 
                className="relative w-80 h-80 md:w-[32rem] md:h-[32rem] object-contain animate-fade-in hover:scale-105 transition-transform duration-500"
            />
        </div>

        <div className="mb-6 inline-block">
          <span className="py-1 px-3 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-sm font-bold tracking-wide">
            NUEVA COLECCIÓN 2025
          </span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight text-gray-900 dark:text-white">
          Viste tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400">Influencia</span>.
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mb-12 leading-relaxed">
          Diseños únicos, colores vibrantes y tecnología 3D. Personaliza tu estilo con Inkfluencia y deja huella donde vayas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button
            onClick={onStart}
            className="bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white text-xl font-bold px-12 py-5 rounded-full shadow-lg hover:shadow-orange-500/25 hover:scale-105 transition-all duration-300"
            >
            Empezar a Crear
            </button>
            <button
            onClick={onViewGallery}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xl font-bold px-12 py-5 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 justify-center"
            >
            <Grid className="w-5 h-5" />
            Ver Colección
            </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl shadow-pink-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-3">3D Studio</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Nuestro probador virtual te permite ver cada pliegue y detalle de tu diseño antes de que se convierta en realidad.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl shadow-cyan-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-500">
            <Palette className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Colores Vivos</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Utilizamos impresión de alta fidelidad para asegurar que los colores de tu pantalla sean los de tu camiseta.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl shadow-yellow-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mb-6 text-yellow-500">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Calidad Premium</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Algodón 100% orgánico y acabados profesionales. No solo vendemos camisetas, vendemos tu marca personal.
          </p>
        </div>
      </div>
    </div>
  );
};