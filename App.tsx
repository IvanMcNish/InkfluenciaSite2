import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { Customizer } from "./components/Customizer";
import { LazyLoader } from "./components/LazyLoader";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { saveDesignToCollection } from "./services/galleryService";
import { DEFAULT_CONFIG } from "./constants";
import { TShirtConfig, ViewState, Order, AdminTab, GalleryTab } from "./types";
import { supabase } from "./lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Code2 } from "lucide-react";

// --- Lazy-loaded views (descargados solo cuando el usuario navega a cada vista) ---
const ImageEditor    = React.lazy(() => import("./components/ImageEditor").then(m => ({ default: m.ImageEditor })));
const GalleryPage    = React.lazy(() => import("./components/GalleryPage").then(m => ({ default: m.GalleryPage })));
const CommunityPage  = React.lazy(() => import("./components/CommunityPage").then(m => ({ default: m.CommunityPage })));
const ContactPage    = React.lazy(() => import("./components/ContactPage").then(m => ({ default: m.ContactPage })));
const OrderForm      = React.lazy(() => import("./components/OrderForm").then(m => ({ default: m.OrderForm })));
const OrderSuccess   = React.lazy(() => import("./components/OrderSuccess").then(m => ({ default: m.OrderSuccess })));
const TrackOrderPage = React.lazy(() => import("./components/TrackOrderPage").then(m => ({ default: m.TrackOrderPage })));
const AdminPanel     = React.lazy(() => import("./components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const AdminLogin     = React.lazy(() => import("./components/AdminLogin").then(m => ({ default: m.AdminLogin })));

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
  const [view, setView] = useState<ViewState>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/admin") return "admin";
      if (path === "/gallery") return "gallery";
      if (path === "/community") return "community";
      if (path === "/track-order") return "track-order";
      if (path === "/contact") return "contact";
      if (path === "/customizer") return "customizer";
    }
    return "landing";
  });
  const [galleryInitialTab, setGalleryInitialTab] = useState<GalleryTab>('community');

  // Customization State
  const [config, setConfig] = useState<TShirtConfig>(DEFAULT_CONFIG);

  // Last successfully created order
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Settings and other states
  const [editImageLayerIndex, setEditImageLayerIndex] = useState<number | null>(null);
  const [previousView, setPreviousView] = useState<ViewState | null>(null);
  const [checkoutSource, setCheckoutSource] = useState<"customizer" | "gallery">("customizer");

  // Router sync helper
  const navigateTo = useCallback((newView: ViewState) => {
    setView(newView);
    if (typeof window !== "undefined") {
      let path = "/";
      if (newView === "admin") path = "/admin";
      else if (newView === "gallery") path = "/gallery";
      else if (newView === "community") path = "/community";
      else if (newView === "track-order") path = "/track-order";
      else if (newView === "contact") path = "/contact";
      else if (newView === "customizer") path = "/customizer";
      window.history.pushState({ view: newView }, "", path);
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/admin") setView("admin");
        else if (path === "/gallery") setView("gallery");
        else if (path === "/community") setView("community");
        else if (path === "/track-order") setView("track-order");
        else if (path === "/contact") setView("contact");
        else if (path === "/customizer") setView("customizer");
        else setView("landing");
      }
    };

    window.addEventListener("popstate", handlePopState as any);
    return () => window.removeEventListener("popstate", handlePopState as any);
  }, []);

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTab>("financial");

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

  const handleOrderSuccess = useCallback((order: Order) => {
    setLastOrder(order);
    setView("success");
  }, []);

  const handleSaveDesign = useCallback(async (name: string, designConfig: TShirtConfig) => {
    // If it has an ID, it was already updated in Customizer
    if (designConfig.id) {
      setConfig(DEFAULT_CONFIG);
      setAdminTab("gallery");
      setView("admin");
    } else {
      await saveDesignToCollection(name, designConfig);
    }
  }, []);

  const handleBuyGalleryDesign = useCallback((designConfig: TShirtConfig) => {
    setConfig(designConfig);
    setCheckoutSource("gallery");
    setView("checkout");
  }, []);

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
          <ErrorBoundary message="Error al cargar el editor de imágenes." onReset={() => setView(previousView || 'customizer')}>
            <Suspense fallback={<LazyLoader message="Cargando editor..." />}>
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
            </Suspense>
          </ErrorBoundary>
        );
      case "gallery":
        return (
          <ErrorBoundary message="Error al cargar la galería." onReset={() => setView('landing')}>
            <Suspense fallback={<LazyLoader message="Cargando galería..." />}>
              <GalleryPage
                onUseDesign={handleBuyGalleryDesign}
                initialTab={galleryInitialTab}
                onNavigateToCreator={() => {
                  setConfig(DEFAULT_CONFIG);
                  setView("customizer");
                }}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case "community":
        return (
          <ErrorBoundary message="Error al cargar la comunidad." onReset={() => setView('landing')}>
            <Suspense fallback={<LazyLoader message="Cargando comunidad..." />}>
              <CommunityPage />
            </Suspense>
          </ErrorBoundary>
        );
      case "contact":
        return (
          <ErrorBoundary message="Error al cargar la página de contacto." onReset={() => setView('landing')}>
            <Suspense fallback={<LazyLoader message="Cargando contacto..." />}>
              <ContactPage />
            </Suspense>
          </ErrorBoundary>
        );
      case "checkout":
        return (
          <ErrorBoundary message="Error al cargar el formulario de pedido." onReset={() => setView(checkoutSource)}>
            <Suspense fallback={<LazyLoader message="Cargando formulario..." />}>
              <OrderForm
                config={config}
                onSuccess={handleOrderSuccess}
                onBack={() => setView(checkoutSource)}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case "success":
        return (
          <ErrorBoundary message="Error al mostrar el resumen del pedido." onReset={() => setView('landing')}>
            <Suspense fallback={<LazyLoader message="Cargando resumen..." />}>
              <OrderSuccess
                order={lastOrder}
                onReset={() => {
                  setConfig(DEFAULT_CONFIG);
                  setLastOrder(null);
                  setView("landing");
                }}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case "track-order":
        return (
          <ErrorBoundary message="Error al buscar el pedido." onReset={() => setView('landing')}>
            <Suspense fallback={<LazyLoader message="Buscando pedido..." />}>
              <TrackOrderPage />
            </Suspense>
          </ErrorBoundary>
        );
      case "admin":
        return session ? (
          <ErrorBoundary message="Error al cargar el panel de administración." onReset={() => setView('landing')}>
            <Suspense fallback={<LazyLoader message="Cargando panel admin..." />}>
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
            </Suspense>
          </ErrorBoundary>
        ) : (
          <ErrorBoundary message="Error al cargar el acceso de administrador.">
            <Suspense fallback={<LazyLoader message="Cargando..." />}>
              <AdminLogin />
            </Suspense>
          </ErrorBoundary>
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
        navigate={navigateTo}
      />

      <main className={`${['customizer', 'designer', 'image-editor', 'landing'].includes(view) ? 'w-full' : 'container mx-auto pt-[76px] lg:pt-[104px]'} flex-1 flex flex-col relative overflow-hidden`}>
        {/* Boundary global: captura cualquier error que escape los boundaries por vista */}
        <ErrorBoundary message="Ocurrió un error inesperado en la aplicación." onReset={() => setView('landing')}>
          {renderContent()}
        </ErrorBoundary>
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
