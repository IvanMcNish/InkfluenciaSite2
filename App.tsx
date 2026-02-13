
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Customizer } from './components/Customizer';
import { OrderForm } from './components/OrderForm';
import { OrderSuccess } from './components/OrderSuccess';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { GalleryPage } from './components/GalleryPage';
import { TrackOrderPage } from './components/TrackOrderPage';
import { CommunityPage } from './components/CommunityPage';
import { ContactPage } from './components/ContactPage';
import { saveDesignToCollection } from './services/galleryService';
import { DEFAULT_CONFIG } from './constants';
import { TShirtConfig, ViewState, Order } from './types';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Code2 } from 'lucide-react';

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

  // Auth State
  const [session, setSession] = useState<Session | null>(null);

  // Footer Intersection State
  const footerRef = useRef<HTMLElement>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session error:", error.message);
        setSession(null);
      } else {
        setSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Footer Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1, // Trigger when 10% of footer is visible
      }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, []);

  const handleOrderSuccess = (order: Order) => {
    setLastOrder(order);
    setView('success');
  };

  const handleSaveDesign = async (name: string, designConfig: TShirtConfig) => {
    await saveDesignToCollection(name, designConfig);
    setConfig(DEFAULT_CONFIG);
    setView('gallery');
  };

  const handleBuyGalleryDesign = (designConfig: TShirtConfig) => {
    setConfig(designConfig);
    setView('checkout'); 
  };

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onStart={() => setView('customizer')} onViewGallery={() => setView('gallery')} />;
      case 'customizer':
        return (
          <Customizer 
            key="customizer-view"
            config={config} 
            setConfig={setConfig} 
            onCheckout={() => setView('checkout')} 
            isDesignerMode={false}
          />
        );
      case 'designer':
        return (
          <Customizer 
            key="designer-view"
            config={config} 
            setConfig={setConfig} 
            onSaveToGallery={handleSaveDesign}
            isDesignerMode={true}
          />
        );
      case 'gallery':
        return (
          <GalleryPage 
             onUseDesign={handleBuyGalleryDesign} 
             onNavigateToCreator={() => {
                setConfig(DEFAULT_CONFIG);
                setView('designer');
             }} 
          />
        );
      case 'community':
        return <CommunityPage />;
      case 'contact':
        return <ContactPage />;
      case 'checkout':
        return (
          <OrderForm 
            config={config} 
            onSuccess={handleOrderSuccess} 
            onBack={() => setView('gallery')} 
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
      case 'track-order':
        return <TrackOrderPage />;
      case 'admin':
        return session ? <AdminPanel /> : <AdminLogin />;
      default:
        return <LandingPage onStart={() => setView('customizer')} onViewGallery={() => setView('gallery')} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 flex flex-col relative">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        currentView={view}
        navigate={setView}
      />
      
      <main className="container mx-auto flex-1 flex flex-col">
        {renderContent()}
      </main>
      
      {/* Floating Mini Footer (Visible when real footer is hidden) */}
      <div 
        className={`fixed bottom-4 left-4 z-40 transition-all duration-500 ease-in-out ${
          !isFooterVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <a 
            href="https://mcnishstudio.pages.dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/30 dark:bg-black/30 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 rounded-full px-3 py-1.5 shadow-lg hover:bg-white/80 dark:hover:bg-black/80 hover:scale-105 transition-all group"
        >
            <Code2 className="w-3 h-3 text-gray-500 group-hover:text-pink-500 transition-colors" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                McNishStudio
            </span>
        </a>
      </div>

      {/* Static Footer */}
      <footer 
        ref={footerRef}
        className="py-6 border-t border-gray-100 dark:border-gray-900 mt-auto bg-gray-50 dark:bg-gray-950/50 print:hidden relative z-10"
      >
        <div className="container mx-auto px-6 flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-500 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                Desarrollado por 
                <a 
                    href="https://mcnishstudio.pages.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold text-gray-800 dark:text-gray-200 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                >
                    McNishStudio
                </a>
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Tecnología & Diseño 3D</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
