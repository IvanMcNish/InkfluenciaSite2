import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Customizer } from './components/Customizer';
import { OrderForm } from './components/OrderForm';
import { OrderSuccess } from './components/OrderSuccess';
import { AdminPanel } from './components/AdminPanel';
import { DEFAULT_CONFIG } from './constants';
import { TShirtConfig, ViewState, Order } from './types';

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
  
  // Last successfully created order
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleOrderSuccess = (order: Order) => {
    setLastOrder(order);
    setView('success');
  };

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
            onSuccess={handleOrderSuccess} 
            onBack={() => setView('customizer')}
          />
        );
      case 'success':
        return (
          <OrderSuccess 
            order={lastOrder} 
            onReset={() => {
                setConfig(DEFAULT_CONFIG);
                setLastOrder(null);
                setView('landing');
            }}
          />
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