import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Customizer } from './components/Customizer';
import { OrderForm } from './components/OrderForm';
import { AdminPanel } from './components/AdminPanel';
import { DEFAULT_CONFIG } from './constants';
import { TShirtConfig, ViewState } from './types';
import { CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('theme') === 'dark' || 
        (!('theme' in window.localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // App Flow State
  const [view, setView] = useState<ViewState>('landing');
  
  // Customization State
  const [config, setConfig] = useState<TShirtConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onStart={() => setView('customizer')} />;
      case 'customizer':
        return (
          <Customizer 
            config={config} 
            setConfig={setConfig} 
            onCheckout={() => setView('checkout')} 
          />
        );
      case 'checkout':
        return (
          <OrderForm 
            config={config} 
            onSuccess={() => setView('success')} 
            onBack={() => setView('customizer')}
          />
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-300">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black mb-4">¡Pedido Recibido!</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
              Gracias por elegir Inkfluencia. Tu estilo está en camino.
            </p>
            <button 
              onClick={() => {
                setConfig(DEFAULT_CONFIG);
                setView('landing');
              }}
              className="bg-gradient-to-r from-pink-600 to-orange-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        );
      case 'admin':
        return <AdminPanel />;
      default:
        return <LandingPage onStart={() => setView('customizer')} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        currentView={view}
        navigate={setView}
      />
      <main className="container mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;