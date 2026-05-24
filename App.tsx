import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { Customizer } from "./components/Customizer";
import { OrderForm } from "./components/OrderForm";
import { OrderSuccess } from "./components/OrderSuccess";
import { AdminPanel } from "./components/AdminPanel";
import { AdminLogin } from "./components/AdminLogin";
import { GalleryPage } from "./components/GalleryPage";
import { TrackOrderPage } from "./components/TrackOrderPage";
import { CommunityPage } from "./components/CommunityPage";
import { ContactPage } from "./components/ContactPage";
import { saveDesignToCollection } from "./services/galleryService";
import { DEFAULT_CONFIG } from "./constants";
import { ImageEditor } from "./components/ImageEditor";
import { TShirtConfig, ViewState, Order } from "./types";
import { supabase } from "./lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Code2 } from "lucide-react";

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.localStorage.getItem("theme") === "dark" ||
        (!("theme" in window.localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  // App Flow State
  const [view, setView] = useState<ViewState>("landing");
  const [galleryInitialTab, setGalleryInitialTab] = useState<'community' | 'catalog'>('community');

  // Customization State
  const [config, setConfig] = useState<TShirtConfig>(DEFAULT_CONFIG);

  // Last successfully created order
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Settings and other states
  const [editImageLayerIndex, setEditImageLayerIndex] = useState<number | null>(null);
  const [previousView, setPreviousView] = useState<ViewState | null>(null);
  const [checkoutSource, setCheckoutSource] = useState<"customizer" | "gallery">("customizer");

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [adminTab, setAdminTab] = useState<
    | "financial"
    | "orders"
    | "inventory"
    | "customers"
    | "gallery"
    | "community"
    | "settings"
  >("financial");

  // Footer Intersection State
  const footerRef = useRef<HTMLElement>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
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
      },
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
    setView("success");
  };

  const handleSaveDesign = async (name: string, designConfig: TShirtConfig) => {
    // If it has an ID, it was already updated in Customizer
    if (designConfig.id) {
      setConfig(DEFAULT_CONFIG);
      setAdminTab("gallery");
      setView("admin");
    } else {
      await saveDesignToCollection(name, designConfig);
    }
  };

  const handleBuyGalleryDesign = (designConfig: TShirtConfig) => {
    setConfig(designConfig);
    setCheckoutSource("gallery");
    setView("checkout");
  };

  const renderContent = () => {
    switch (view) {
      case "landing":
      case "customizer":
        return (
          <>
            <div className="absolute inset-0 z-0 h-full w-full">
              <Customizer
                key="customizer-view"
                config={config}
                setConfig={setConfig}
                onCheckout={() => {
                  setCheckoutSource("customizer");
                  setView("checkout");
                }}
                onSaveToGallery={handleSaveDesign}
                onNavigateToGallery={() => {
                  setConfig(DEFAULT_CONFIG);
                  setView("gallery");
                }}
                onEditImage={(index) => {
                  setEditImageLayerIndex(index);
                  setPreviousView("customizer");
                  setView("image-editor");
                }}
                isDesignerMode={false}
                isActive={view === "customizer"}
              />
            </div>
            
            <LandingPage
              isVisible={view === "landing"}
              onStart={() => setView("customizer")}
              onViewCatalog={() => {
                setGalleryInitialTab('catalog');
                setView('gallery');
              }}
            />
          </>
        );
      case "designer":
        return (
          <div className="absolute inset-0 z-0 h-full w-full">
            <Customizer
              key="designer-view"
              config={config}
              setConfig={setConfig}
              onSaveToGallery={handleSaveDesign}
              onNavigateToGallery={() => {
                setConfig(DEFAULT_CONFIG);
                setView("admin");
              }}
              onEditImage={(index) => {
                setEditImageLayerIndex(index);
                setPreviousView(view);
                setView("image-editor");
              }}
              isDesignerMode={true}
              isActive={true}
            />
          </div>
        );
      case "image-editor":
        if (editImageLayerIndex === null || !config.layers[editImageLayerIndex]) {
            setTimeout(() => setView(previousView || "customizer"), 0);
            return null;
        }
        return (
            <ImageEditor
                layer={config.layers[editImageLayerIndex]}
                onSave={(updatedLayer) => {
                    const newLayers = [...config.layers];
                    newLayers[editImageLayerIndex] = updatedLayer;
                    setConfig({ ...config, layers: newLayers });
                    setView(previousView || "customizer");
                    setEditImageLayerIndex(null);
                }}
                onClose={() => {
                    setView(previousView || "customizer");
                    setEditImageLayerIndex(null);
                }}
            />
        );
      case "gallery":
        return (
          <GalleryPage
            onUseDesign={handleBuyGalleryDesign}
            initialTab={galleryInitialTab}
            onNavigateToCreator={() => {
              setConfig(DEFAULT_CONFIG);
              setView("customizer");
            }}
          />
        );
      case "community":
        return <CommunityPage />;
      case "contact":
        return <ContactPage />;
      case "checkout":
        return (
          <OrderForm
            config={config}
            onSuccess={handleOrderSuccess}
            onBack={() => setView(checkoutSource)}
          />
        );
      case "success":
        return (
          <OrderSuccess
            order={lastOrder}
            onReset={() => {
              setConfig(DEFAULT_CONFIG);
              setLastOrder(null);
              setView("landing");
            }}
          />
        );
      case "track-order":
        return <TrackOrderPage />;
      case "admin":
        return session ? (
          <AdminPanel
            initialTab={adminTab}
            onEditDesign={(design) => {
              setConfig({
                ...design.config,
                id: design.id,
                designName: design.name,
              });
              setView("designer");
            }}
          />
        ) : (
          <AdminLogin />
        );
      default:
        return (
          <>
            <div className="absolute inset-0 z-0 h-full w-full">
              <Customizer
                key="customizer-view-default"
                config={config}
                setConfig={setConfig}
                onCheckout={() => {
                  setCheckoutSource("customizer");
                  setView("checkout");
                }}
                onSaveToGallery={handleSaveDesign}
                onNavigateToGallery={() => {
                  setConfig(DEFAULT_CONFIG);
                  setView("gallery");
                }}
                onEditImage={(index) => {
                  setEditImageLayerIndex(index);
                  setPreviousView("customizer");
                  setView("image-editor");
                }}
                isDesignerMode={false}
                isActive={view === "customizer"}
              />
            </div>
            <LandingPage
              isVisible={view === "landing"}
              onStart={() => setView("customizer")}
              onViewCatalog={() => {
                setGalleryInitialTab('catalog');
                setView('gallery');
              }}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 flex flex-col relative">
      {/* Dynamic ambient background matching customizer / render viewport */}
      <div className="fixed inset-0 bg-gray-50 dark:bg-zinc-950 -z-20 transition-colors duration-300" />
      <div className="fixed inset-0 bg-[url('/light.jpeg')] dark:bg-[url('/dark.jpeg')] bg-cover bg-center blur-sm scale-110 opacity-80 -z-10 transition-all duration-300 pointer-events-none" />

      <Navbar
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        currentView={view}
        navigate={setView}
      />

      <main className={`${['customizer', 'designer', 'image-editor', 'landing'].includes(view) ? 'w-full' : 'container mx-auto pt-[76px] lg:pt-[104px]'} flex-1 flex flex-col relative overflow-hidden`}>
        {renderContent()}
      </main>

      {/* Floating Mini Footer (Visible when real footer is hidden) */}
      <div
          className={`fixed bottom-4 left-4 z-40 hidden xl:block transition-all duration-500 ease-in-out ${
            !isFooterVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10 pointer-events-none"
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
          className="py-2 border-t border-gray-100 dark:border-gray-900 mt-auto bg-gray-50 dark:bg-gray-950/50 print:hidden relative z-10"
        >
          <div className="container mx-auto px-6 flex flex-col items-center justify-center gap-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-500 flex items-center gap-1.5">
              <Code2 className="w-3 h-3" />
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
          </div>
        </footer>
    </div>
  );
};

export default App;
