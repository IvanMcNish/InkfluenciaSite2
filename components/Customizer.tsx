
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Move, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, LayoutTemplate, RotateCcw, Trash2, Layers, Save, ShoppingBag, AlertTriangle, Loader2, Info, RefreshCw, Shirt, Ruler, Lock, Unlock, MousePointer2, HelpCircle, X, Hand, Video, Scissors, Columns, Palette } from 'lucide-react';
import { TShirtConfig, CustomizerConstraints } from '../types';
import { Scene } from './Scene';
import { PRICES, formatCurrency, TSHIRT_GLB_MODELS } from '../constants';
import { getAppearanceSettings, getCustomizerConstraints, getToteCustomizerConstraints, DEFAULT_CONSTRAINTS, DEFAULT_TOTE_CONSTRAINTS, getUploadLimits, DEFAULT_UPLOAD_LIMITS, DEFAULT_APPEARANCE } from '../services/settingsService';
import { updateGalleryItem } from '../services/galleryService';
import { ImageEditor } from './ImageEditor';

interface CustomizerProps {
  config: TShirtConfig;
  setConfig: React.Dispatch<React.SetStateAction<TShirtConfig>>;
  onCheckout?: () => void;
  onSaveToGallery?: (name: string, config: TShirtConfig) => void;
  onEditImage?: (index: number) => void;
  isDesignerMode?: boolean;
  isActive?: boolean;
}

export const Customizer: React.FC<CustomizerProps> = ({ config, setConfig, onCheckout, onSaveToGallery, onEditImage, isDesignerMode = false, isActive = true }) => {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const captureRef = useRef<(() => string) | null>(null);
  
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);
  const [designName, setDesignName] = useState(config.designName || '');
  const [saveError, setSaveError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  
  // New States for UX improvements
  const [showTutorial, setShowTutorial] = useState(false);
  const [isViewLocked, setIsViewLocked] = useState(false);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0, zoom: 0 });
  const [isPanelHidden, setIsPanelHidden] = useState(true);
  
  // Mobile redesign state
  const [mobileActiveTab, setMobileActiveTab] = useState<'product' | 'upload' | 'adjust' | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');

  // Continues & Mobile Panels UX Optimization
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueStep, setContinueStep] = useState<'options' | 'save' | 'ordering'>('options');

  const mobileBarRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileBrushBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsLandscape(window.innerWidth < 1024 && window.innerHeight < window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dismiss mobile panels when tapping outside
  useEffect(() => {
    if (!isMobile || !isMobilePanelOpen || showContinueModal) return;
    
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (mobileToggleRef.current?.contains(e.target as Node) || 
          mobileBrushBtnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (mobileBarRef.current?.contains(e.target as Node) || 
          mobileOverlayRef.current?.contains(e.target as Node)) {
        return;
      }
      
      // Close the specific config panel back to buttons first, or collapse entirely
      if (mobileActiveTab) {
        setMobileActiveTab(null);
      } else {
        setIsMobilePanelOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isMobile, isMobilePanelOpen, mobileActiveTab, showContinueModal]);

  const [constraints, setConstraints] = useState<CustomizerConstraints>(DEFAULT_CONSTRAINTS);
  const [toteConstraints, setToteConstraints] = useState<CustomizerConstraints>(DEFAULT_TOTE_CONSTRAINTS);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number>(DEFAULT_UPLOAD_LIMITS.maxFileSizeMB);
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [constraintsLoaded, setConstraintsLoaded] = useState(false);
  const [editingLayer, setEditingLayer] = useState<DesignLayer | null>(null);

  useEffect(() => {
      // Tutorial logic
      if (isActive) {
          const hasSeenTutorial = localStorage.getItem('inkfluencia_tutorial_seen');
          if (!hasSeenTutorial) {
              // Delay tutorial slightly for smooth transition after landing
              const timer = setTimeout(() => {
                  setShowTutorial(true);
              }, 600);
              return () => clearTimeout(timer);
          }
      } else {
          setShowTutorial(false);
          setMobileActiveTab(null);
      }
  }, [isActive]);

  const handleTutorialClose = () => {
      setShowTutorial(false);
      localStorage.setItem('inkfluencia_tutorial_seen', 'true');
  };

  useEffect(() => {
      const loadSettings = async () => {
          const [constraintsData, toteConstraintsData, limitsData, appearanceData] = await Promise.all([
              getCustomizerConstraints(),
              getToteCustomizerConstraints(),
              getUploadLimits(),
              getAppearanceSettings()
          ]);
          setConstraints(constraintsData);
          setToteConstraints(toteConstraintsData);
          setMaxFileSizeMB(limitsData.maxFileSizeMB);
          setAppearance(appearanceData);
          setConstraintsLoaded(true);
      };
      loadSettings();
  }, []);

  const activeConstraints = config.productType === 'totebag' ? toteConstraints : constraints;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        alert(`La imagen es demasiado grande. Por favor usa una imagen menor a ${maxFileSizeMB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas');
           const MAX_WIDTH = 600; 
           let width = img.width;
           let height = img.height;

           if (width > MAX_WIDTH) {
             height = Math.round((height * MAX_WIDTH) / width);
             width = MAX_WIDTH;
           }

           canvas.width = width;
           canvas.height = height;
           
           const ctx = canvas.getContext('2d');
           if (ctx) {
             ctx.clearRect(0, 0, width, height);
             ctx.drawImage(img, 0, 0, width, height);
             
             let url = canvas.toDataURL('image/webp', 0.8);
             
             if (url.indexOf('image/webp') === -1) {
                 url = canvas.toDataURL('image/png');
             }
             
             setConfig(prev => {
                const newLayers = [...prev.layers];
                const newLayer = {
                    id: `layer-${Date.now()}`,
                    textureUrl: url,
                    originalUrl: url,
                    side: 'front' as const, 
                    position: { x: 0, y: 0.1, scale: 0.25 }
                };
                
                if (newLayers[slotIndex]) {
                    newLayers[slotIndex] = { ...newLayers[slotIndex], textureUrl: url, originalUrl: url, filters: undefined, chromaKey: undefined };
                } else {
                    if (slotIndex === 1 && !newLayers[0]) return prev; 
                    newLayers[slotIndex] = newLayer;
                }
                
                return { ...prev, layers: newLayers };
             });
             setActiveLayerIndex(slotIndex);
             // Auto-lock view to help user position immediately
             setIsViewLocked(true);
           }
        }
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLayer = (index: number) => {
    setConfig(prev => {
        const newLayers = prev.layers.filter((_, i) => i !== index);
        return { ...prev, layers: newLayers };
    });
    setActiveLayerIndex(0);
  };

  const handleColorChange = (color: 'white' | 'black') => {
    setConfig(prev => ({ ...prev, color }));
  };

  const toggleLayerSide = () => {
      setConfig(prev => {
          const newLayers = [...prev.layers];
          if (!newLayers[activeLayerIndex]) return prev;

          const currentSide = newLayers[activeLayerIndex].side || 'front';
          newLayers[activeLayerIndex] = {
              ...newLayers[activeLayerIndex],
              side: currentSide === 'front' ? 'back' : 'front'
          };
          return { ...prev, layers: newLayers };
      });
  };

  const getDynamicBounds = (scale: number, axis: 'x' | 'y') => {
      const halfSize = scale / 2;
      const min = activeConstraints[axis].min + halfSize;
      const max = activeConstraints[axis].max - halfSize;
      if (min > max) return { min: 0, max: 0 };
      return { min, max };
  };

  const adjustPosition = (axis: 'x' | 'y', delta: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        const currentLayer = newLayers[activeLayerIndex];
        let newValue = currentLayer.position[axis] + delta;
        const { min, max } = getDynamicBounds(currentLayer.position.scale, axis);
        newValue = Math.max(min, Math.min(newValue, max));

        newLayers[activeLayerIndex] = {
            ...currentLayer,
            position: {
                ...currentLayer.position,
                [axis]: newValue
            }
        };
        return { ...prev, layers: newLayers };
    });
  };

  // Callback for Drag-and-Drop from 3D Scene
  const handleDragPosition = (x: number, y: number) => {
      setConfig(prev => {
          const newLayers = [...prev.layers];
          if (!newLayers[activeLayerIndex]) return prev;

          const currentLayer = newLayers[activeLayerIndex];
          const { min: minX, max: maxX } = getDynamicBounds(currentLayer.position.scale, 'x');
          const { min: minY, max: maxY } = getDynamicBounds(currentLayer.position.scale, 'y');

          // Clamp values
          const clampedX = Math.max(minX, Math.min(x, maxX));
          const clampedY = Math.max(minY, Math.min(y, maxY));

          newLayers[activeLayerIndex] = {
              ...currentLayer,
              position: {
                  ...currentLayer.position,
                  x: clampedX,
                  y: clampedY
              }
          };
          return { ...prev, layers: newLayers };
      });
  };

  const adjustScale = (delta: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        const currentLayer = newLayers[activeLayerIndex];
        let newScale = currentLayer.position.scale + delta;
        newScale = Math.max(activeConstraints.scale.min, Math.min(newScale, activeConstraints.scale.max));

        const xBounds = getDynamicBounds(newScale, 'x');
        const yBounds = getDynamicBounds(newScale, 'y');

        const correctedX = Math.max(xBounds.min, Math.min(currentLayer.position.x, xBounds.max));
        const correctedY = Math.max(yBounds.min, Math.min(currentLayer.position.y, yBounds.max));

        newLayers[activeLayerIndex] = {
            ...currentLayer,
            position: {
                ...currentLayer.position,
                scale: newScale,
                x: correctedX,
                y: correctedY
            }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const setScaleValue = (value: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        const currentLayer = newLayers[activeLayerIndex];
        const newScale = Math.max(activeConstraints.scale.min, Math.min(value, activeConstraints.scale.max));

        const xBounds = getDynamicBounds(newScale, 'x');
        const yBounds = getDynamicBounds(newScale, 'y');

        const correctedX = Math.max(xBounds.min, Math.min(currentLayer.position.x, xBounds.max));
        const correctedY = Math.max(yBounds.min, Math.min(currentLayer.position.y, yBounds.max));

        newLayers[activeLayerIndex] = {
            ...currentLayer,
            position: {
                ...currentLayer.position,
                scale: newScale,
                x: correctedX,
                y: correctedY
            }
        };
        return { ...prev, layers: newLayers };
    });
  }

  const centerImage = () => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        newLayers[activeLayerIndex] = {
            ...newLayers[activeLayerIndex],
            position: { x: 0, y: 0.1, scale: 0.25 }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const handleSaveToGalleryRef = async (nameToSave: string) => {
    setIsProcessing(true);
    setSaveError('');
    
    // Disable guides and reset view for perfect snapshot
    const wasShowingGuides = showGuides;
    if (wasShowingGuides) setShowGuides(false);
    
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        let snapshot = '';
        if (captureRef.current) {
            try {
                snapshot = captureRef.current();
            } catch (e) {
                console.error("Failed to capture snapshot:", e);
            }
        }
        
        if (wasShowingGuides) setShowGuides(true);

        const configWithSnapshot = { ...config, snapshotUrl: snapshot };
        setConfig(configWithSnapshot);
        
        try {
            if (config.id) {
                // Update existing design
                const success = await updateGalleryItem(config.id, nameToSave, true, configWithSnapshot);
                if (success) {
                    alert("Diseño actualizado con éxito.");
                    if (onSaveToGallery) onSaveToGallery(nameToSave, configWithSnapshot);
                    return true;
                } else {
                    throw new Error("Update failed");
                }
            } else {
                // Create new design
                if (onSaveToGallery) {
                    await onSaveToGallery(nameToSave, configWithSnapshot);
                    return true;
                } else {
                    return false;
                }
            }
        } catch (e: any) {
             console.error("Gallery save error:", e);
             if (e.name === 'QuotaExceededError' || e.message?.includes('exceeded the quota')) {
                 setSaveError('¡Espacio lleno! Por favor ve a la galería y elimina diseños antiguos para liberar espacio.');
             } else {
                 setSaveError('No se pudo guardar el diseño. Intenta nuevamente.');
             }
             return false;
        }
    } catch (error) {
        console.error("Error processing action:", error);
        setSaveError("Ocurrió un error inesperado.");
        if (wasShowingGuides) setShowGuides(true);
        return false;
    } finally {
        setIsProcessing(false);
    }
  };

  const handleBuyDesign = async () => {
    setIsProcessing(true);
    
    // Disable guides and reset view for perfect snapshot
    const wasShowingGuides = showGuides;
    if (wasShowingGuides) setShowGuides(false);
    
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        let snapshot = '';
        if (captureRef.current) {
            try {
                snapshot = captureRef.current();
            } catch (e) {
                console.error("Failed to capture snapshot:", e);
            }
        }
        
        if (wasShowingGuides) setShowGuides(true);

        const configWithSnapshot = { ...config, snapshotUrl: snapshot };
        setConfig(configWithSnapshot);
        
        if (onCheckout) {
             onCheckout();
        }
    } catch (error) {
        console.error("Error starting checkout:", error);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAction = async () => {
    setIsProcessing(true);
    setSaveError('');
    
    // Disable guides and reset view for perfect snapshot
    const wasShowingGuides = showGuides;
    if (wasShowingGuides) setShowGuides(false);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        let snapshot = '';
        if (captureRef.current) {
            try {
                snapshot = captureRef.current();
            } catch (e) {
                console.error("Failed to capture snapshot:", e);
            }
        }
        
        if (wasShowingGuides) setShowGuides(true);

        const configWithSnapshot = { ...config, snapshotUrl: snapshot };
        setConfig(configWithSnapshot);
        
        if (isDesignerMode) {
             if (!designName.trim()) {
                 setSaveError('Por favor, ingresa un nombre para tu diseño.');
                 setIsProcessing(false);
                 return;
             }
             try {
                if (config.id) {
                    // Update existing design
                    const success = await updateGalleryItem(config.id, designName, true, configWithSnapshot);
                    if (success) {
                        alert("Diseño actualizado con éxito.");
                        // We could redirect or just reset
                        if (onSaveToGallery) onSaveToGallery(designName, configWithSnapshot);
                    } else {
                        throw new Error("Update failed");
                    }
                } else {
                    // Create new design
                    if (onSaveToGallery) onSaveToGallery(designName, configWithSnapshot);
                }
             } catch (e: any) {
                 console.error("Gallery save error:", e);
                 if (e.name === 'QuotaExceededError' || e.message?.includes('exceeded the quota')) {
                     setSaveError('¡Espacio lleno! Por favor ve a la galería y elimina diseños antiguos para liberar espacio.');
                 } else {
                     setSaveError('No se pudo guardar el diseño. Intenta nuevamente.');
                 }
                 setIsProcessing(false);
                 return;
             }
        } else if (onCheckout) {
             onCheckout();
        }
    } catch (error) {
        console.error("Error processing action:", error);
        setSaveError("Ocurrió un error inesperado.");
        if (wasShowingGuides) setShowGuides(true);
    } finally {
        setIsProcessing(false);
    }
  };

  const activeLayer = config.layers[activeLayerIndex];

  // Action / Continue Modal Component
  const ContinueModal = () => {
    if (!showContinueModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative liquid-glass animate-elastic-pop max-h-[92vh] overflow-y-auto">
          
          <button 
            onClick={() => {
              if (continueStep !== 'ordering') {
                setShowContinueModal(false);
              }
            }}
            disabled={continueStep === 'ordering'}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/40 dark:bg-gray-900/40 text-gray-500 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-500 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {continueStep === 'options' && (
            <div className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white text-center mb-1 uppercase tracking-tight">
                ¿Qué deseas hacer con tu diseño?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm text-center mb-6">
                Elige la opción que prefieras para tu creación de Inkfluencia.
              </p>

              <div className="space-y-4">
                {/* Buy Option */}
                <button
                  onClick={async () => {
                    setContinueStep('ordering');
                    // Wait for the animated transition
                    await new Promise(resolve => setTimeout(resolve, 2500));
                    await handleBuyDesign();
                    setShowContinueModal(false);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-pink-100 dark:border-pink-900/30 bg-pink-50/30 dark:bg-pink-950/10 hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 transition-all group flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-base">Comprar ahora</h4>
                    <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Personaliza tu talla y gramaje de algodón peruano para recibir el pedido impreso con tecnología DTF en cualquier rincón del país.
                    </p>
                  </div>
                </button>

                {/* Save Option */}
                <button
                  onClick={() => {
                    setContinueStep('save');
                  }}
                  className="w-full text-left p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/10 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-base">Guardar en la Comunidad</h4>
                    <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Comparte tu diseño en la galería pública de Inkfluencia para que otros puedan verlo, inspirarse o pedirlo usando tu plantilla.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {continueStep === 'save' && (
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight text-left">
                Publicar en la Galería
              </h3>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/35 flex gap-2.5 mb-5 select-none text-left">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Las imágenes que va a incluir en el diseño serán <strong>públicas</strong> para toda la comunidad. Evite compartir imágenes personales o sensibles. Su diseño será revisado por el admin y una vez aprobado estará disponible en la galería de la comunidad.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-450 mb-1">Nombre del Diseño</label>
                  <input 
                    type="text" 
                    value={designName}
                    onChange={(e) => {
                      setDesignName(e.target.value);
                      setSaveError('');
                    }}
                    placeholder="Ej. Colección Vintage"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm font-medium"
                    disabled={isProcessing}
                  />
                  {saveError && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/2 transition-all p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <p>{saveError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setContinueStep('options')}
                    disabled={isProcessing}
                    className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Volver
                  </button>
                  <button
                    onClick={async () => {
                      if (!designName.trim()) {
                        setSaveError('Por favor, ingresa un nombre para tu diseño.');
                        return;
                      }
                      const success = await handleSaveToGalleryRef(designName);
                      if (success) {
                        setShowContinueModal(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1.5 py-3 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar y Publicar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {continueStep === 'ordering' && (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-23 h-20 mb-6 flex items-center justify-center">
                {/* 3D spinning / glowing effect */}
                <div className="absolute w-20 h-20 rounded-full border-4 border-pink-500/10 border-t-pink-500 animate-spin" />
                <div className="absolute w-16 h-16 rounded-full border-4 border-orange-500/10 border-b-orange-500 animate-spin-slow" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <Shirt className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                PROCESANDO TU DISEÑO...
              </h3>
              
              <div className="space-y-1.5 max-w-sm w-full">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono tracking-wider animate-pulse mb-2">
                  Generando render en alta definición...
                </p>
                <div className="w-full max-w-[200px] h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-orange-500 animate-loading-bar rounded-full" />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-1.5 items-center font-mono text-[10px] text-gray-400 select-none">
                <span className="flex items-center gap-1.5 text-pink-500">✓ Optimizando archivos vectoriales DTF</span>
                <span className="flex items-center gap-1.5 text-orange-500">✓ Ajustando capas 3D de alta definición</span>
                <span className="flex items-center gap-1.5 text-yellow-500">✓ Preparando orden de algodón peruano</span>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // Tutorial Modal Component
  const TutorialModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                      <Shirt className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Crea tu Estilo Único</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sigue estos pasos para diseñar la camiseta perfecta:</p>
                  
                  <div className="space-y-3 text-left mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-pink-200 transition-colors">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                              <Upload className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">1. Sube tu imagen</h4>
                              <p className="text-xs text-gray-500">Puedes añadir hasta 2 diseños diferentes.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-pink-200 transition-colors">
                          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 shrink-0">
                              <Scissors className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">2. Edición Avanzada</h4>
                              <p className="text-xs text-gray-500">Usa <span className="font-bold text-pink-500">Editar Imagen</span> para filtros de color, tintado y <span className="font-bold text-pink-500">máscaras de recorte (bordes rasgados)</span>.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-pink-200 transition-colors">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                              <Lock className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">3. Modo Edición</h4>
                              <p className="text-xs text-gray-500">Activa el candado para <span className="font-bold text-purple-500">arrastrar y mover</span> la imagen sobre la prenda.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-pink-200 transition-colors">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                              <Hand className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">4. Transparencia</h4>
                              <p className="text-xs text-gray-500">Ajusta la opacidad del diseño para un efecto desvanecido o vintage.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-pink-200 transition-colors">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 shrink-0">
                              <RefreshCw className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">5. Vista 360°</h4>
                              <p className="text-xs text-gray-500">Desbloquea el candado para rotar y ver tu diseño desde cualquier ángulo.</p>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleTutorialClose}
                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-105"
                  >
                      ¡Entendido, empezar a diseñar!
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className={`relative w-full h-full overflow-hidden flex bg-gray-50 dark:bg-black ${
      isLandscape ? 'flex-row' : 'flex-col lg:flex-row'
    }`}>
      
      {showTutorial && <TutorialModal />}

      {/* Left Column: 3D Scene Wrapper */}
      <div className={`relative flex-1 min-h-0 transition-all duration-300 ${
          isMobile 
          ? 'absolute inset-0 w-full h-full' 
          : (isPanelHidden ? 'w-full h-full' : 'w-[calc(100%-420px)] h-full lg:border-r lg:border-gray-200/50 lg:dark:border-gray-800/50')
      }`}>
        {viewMode === 'single' ? (
          <Scene 
              config={config} 
              captureRef={captureRef} 
              activeLayerSide={activeLayer?.side || 'front'} 
              showMeasurements={showGuides}
              lockView={isViewLocked}
              onPositionChange={handleDragPosition}
              onLayerSelect={setActiveLayerIndex}
              cameraOffset={cameraOffset}
              hideHelpText={!!mobileActiveTab || (!isMobile && !isPanelHidden)}
          />
        ) : (
          <div className={`w-full h-full flex gap-4 p-4 overflow-auto bg-gray-100/50 dark:bg-zinc-950/20 ${isLandscape ? 'flex-row' : 'flex-col md:flex-row'}`}>
            <div className="flex-1 min-h-[300px] h-full relative overflow-hidden bg-white/25 dark:bg-black/25 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg flex flex-col">
              <div className="absolute bottom-3 left-3 bg-pink-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full backdrop-blur-md z-30 shadow-md">
                Frente
              </div>
              <div className="flex-1 h-0">
                <Scene 
                    config={config} 
                    captureRef={captureRef} 
                    activeLayerSide="front" 
                    showMeasurements={showGuides}
                    lockView={isViewLocked}
                    onPositionChange={handleDragPosition}
                    onLayerSelect={setActiveLayerIndex}
                    cameraOffset={cameraOffset}
                    hideHelpText={true}
                />
              </div>
            </div>
            <div className="flex-1 min-h-[300px] h-full relative overflow-hidden bg-white/25 dark:bg-black/25 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg flex flex-col">
              <div className="absolute top-3 md:bottom-3 left-3 md:top-auto bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full backdrop-blur-md z-30 shadow-md">
                Espalda
              </div>
              <div className="flex-1 h-0">
                <Scene 
                    config={config} 
                    activeLayerSide="back" 
                    showMeasurements={showGuides}
                    lockView={isViewLocked}
                    onPositionChange={handleDragPosition}
                    onLayerSelect={setActiveLayerIndex}
                    cameraOffset={cameraOffset}
                    hideHelpText={true}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Scene Controls Overlay */}
        <div className="absolute top-[92px] lg:top-[120px] left-4 lg:left-6 flex flex-col gap-2.5 z-20 pointer-events-none">
            {/* Lock/Unlock Toggle */}
            {viewMode === 'single' ? (
                <div className="flex flex-col gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setIsViewLocked(!isViewLocked)}
                        className={`flex items-center justify-center transition-all font-bold backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-lg ${
                            isMobile 
                            ? 'w-9 h-9 rounded-full bg-white/80 dark:bg-black/80 text-gray-706 dark:text-white hover:bg-white dark:hover:bg-black' 
                            : `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
                                isViewLocked 
                                ? 'bg-pink-500 text-white hover:bg-pink-600' 
                                : 'bg-white/80 dark:bg-black/80 text-gray-705 dark:text-white hover:bg-white dark:hover:bg-black'
                              }`
                        }`}
                        title={isViewLocked ? 'Mover Imagen' : 'Rotar Cámara'}
                    >
                        {isViewLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        {!isMobile && (
                            <span className="text-[10px] uppercase tracking-wide">
                                {isViewLocked ? 'Mover Imagen' : 'Rotar Cámara'}
                            </span>
                        )}
                    </button>
                    
                    {isViewLocked && !isMobile && (
                        <div className="bg-black/60 border border-white/10 text-white text-[9px] px-2 py-0.5 rounded-md backdrop-blur-md animate-fade-in flex items-center gap-1 w-max shadow-lg">
                            <Hand className="w-2.5 h-2.5" /> Arrastra sobre la camiseta
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1.5 pointer-events-auto opacity-80">
                    <button
                        disabled
                        className={`flex items-center justify-center transition-all font-bold backdrop-blur-md border border-pink-500/30 dark:border-pink-500/35 shadow-lg cursor-not-allowed ${
                            isMobile 
                            ? 'w-9 h-9 rounded-full bg-pink-500 hover:bg-pink-500 text-white' 
                            : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-pink-500 text-white'
                        }`}
                        title="Modo Mover Imagen obligatorio en Vista Dual"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        {!isMobile && (
                            <span className="text-[10px] uppercase tracking-wide">
                                Mover Imagen (Vista Dual)
                            </span>
                        )}
                    </button>
                    {!isMobile && (
                        <div className="bg-black/60 border border-white/10 text-white text-[9px] px-2 py-0.5 rounded-md backdrop-blur-md animate-fade-in flex items-center gap-1 w-max shadow-lg">
                            <Hand className="w-2.5 h-2.5" /> Arrastra sobre la camiseta
                        </div>
                    )}
                </div>
            )}

            {/* Top Left Tools Row (Ruler & Tutorial next to image locks) */}
            <div className={`flex pointer-events-auto ${isMobile ? 'flex-col gap-2.5' : 'flex-row items-center gap-2'}`}>
                <button
                    onClick={() => setShowGuides(!showGuides)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all border border-white/20 dark:border-gray-700/50 ${showGuides ? 'bg-indigo-500 text-white' : 'bg-white/80 dark:bg-black/80 text-gray-704 dark:text-white backdrop-blur-md'}`}
                    title="Regla / Medidas"
                >
                    <Ruler className="w-4 h-4 flex-shrink-0" />
                </button>
                <button
                    onClick={() => {
                        if (viewMode === 'single') {
                            setViewMode('double');
                            setIsViewLocked(true); // Desactiva rotación, se activa mover imagen
                        } else {
                            setViewMode('single');
                            setIsViewLocked(false); // Vuelve a estar disponible rotación de cámara
                        }
                    }}
                    className={`w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all border border-white/20 dark:border-gray-700/50 ${viewMode === 'double' ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white animate-pulse' : 'bg-white/80 dark:bg-black/80 text-gray-704 dark:text-white backdrop-blur-md'}`}
                    title={viewMode === 'single' ? "Vista Dos Caras" : "Vista Individual"}
                >
                    <Columns className="w-4 h-4 flex-shrink-0" />
                </button>
                <button
                    onClick={() => setShowTutorial(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all bg-white/80 dark:bg-black/80 text-gray-704 dark:text-white backdrop-blur-md border border-white/20 dark:border-gray-700/50"
                    title="Ayuda"
                >
                    <HelpCircle className="w-4 h-4 flex-shrink-0" />
                </button>
            </div>
        </div>

        {/* Floating Button when Panel is Hidden (Desktop) */}
        {isPanelHidden && (
        <button 
          onClick={() => setIsPanelHidden(false)}
          className="hidden lg:flex absolute top-[120px] right-6 items-center gap-2 px-4 py-2.5 rounded-full shadow-xl transition-all font-bold backdrop-blur-md border border-white/20 dark:border-gray-700/50 bg-white/90 dark:bg-black/90 text-gray-707 dark:text-white animate-fade-in hover:scale-105 z-30"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Personalizar</span>
        </button>
        )}
      </div>

      {/* Mobile Redesigned Compact Navigation Bar & Floating Paintbrush (Morphing Container) */}
      {isMobile && !mobileActiveTab && !showContinueModal && (
        <div 
          ref={isMobilePanelOpen ? mobileBarRef : mobileBrushBtnRef}
          onClick={!isMobilePanelOpen ? () => setIsMobilePanelOpen(true) : undefined}
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl z-[100] flex items-center justify-center select-none ${
            isMobilePanelOpen 
            ? 'w-[calc(100%-32px)] max-w-sm sm:max-w-md h-14 rounded-2xl bg-white/70 dark:bg-gray-950/70 border border-gray-200/30 dark:border-gray-900/30 px-3 py-2 justify-between cursor-default liquid-glass' 
            : 'w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 text-white cursor-pointer hover:scale-110 active:scale-95 border border-white/20 hover:shadow-pink-400/25 shadow-lg flex'
          }`}
        >
          {!isMobilePanelOpen ? (
            <div className="w-full h-full flex items-center justify-center animate-fade-in text-white text-base">
              <Palette className="w-5 h-5 animate-pulse" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-between animate-scale-up gap-0.5">
              <button 
                onClick={(e) => { e.stopPropagation(); setMobileActiveTab('product'); }} 
                className="flex flex-col items-center gap-0.5 justify-center transition-colors px-1 py-0.5 text-gray-500 hover:text-pink-500 dark:hover:text-gray-200 cursor-pointer"
              >
                  <Shirt className="w-4.5 h-4.5 text-gray-700 dark:text-gray-300" />
                  <span className="text-[9px] font-bold uppercase tracking-tight leading-none mt-0.5">Prenda</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); setMobileActiveTab('upload'); }} 
                className="flex flex-col items-center gap-0.5 justify-center transition-colors px-1 py-0.5 text-gray-500 hover:text-pink-500 dark:hover:text-gray-200 cursor-pointer"
              >
                  <Upload className="w-4.5 h-4.5 text-gray-700 dark:text-gray-300" />
                  <span className="text-[9px] font-bold uppercase tracking-tight leading-none mt-0.5">Diseño</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); setMobileActiveTab('adjust'); }} 
                className="flex flex-col items-center gap-0.5 justify-center transition-colors px-1 py-0.5 text-gray-500 hover:text-pink-500 dark:hover:text-gray-200 cursor-pointer"
              >
                  <ZoomIn className="w-4.5 h-4.5 text-gray-700 dark:text-gray-300" />
                  <span className="text-[9px] font-bold uppercase tracking-tight leading-none mt-0.5">Ajustes</span>
              </button>

              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  if (config.layers.length > 0 && onEditImage) {
                    onEditImage(activeLayerIndex);
                  }
                }} 
                disabled={config.layers.length === 0}
                className={`flex flex-col items-center gap-0.5 justify-center transition-colors px-1 py-0.5 cursor-pointer ${config.layers.length === 0 ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40' : 'text-gray-505 hover:text-pink-500'}`}
              >
                  <Scissors className={`w-4.5 h-4.5 ${config.layers.length > 0 ? 'animate-pulse text-pink-500' : ''}`} />
                  <span className="text-[9px] font-bold uppercase tracking-tight leading-none mt-0.5">Editor</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); setIsMobilePanelOpen(false); }} 
                className="flex flex-col items-center gap-0.5 justify-center transition-colors px-1.5 py-0.5 text-gray-400 hover:text-pink-500 dark:hover:text-white cursor-pointer"
                title="Cerrar panel"
              >
                  <X className="w-4.5 h-4.5" />
                  <span className="text-[9px] font-bold uppercase tracking-tight leading-none mt-0.5">Cerrar</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setContinueStep('options');
                  setShowContinueModal(true);
                }} 
                disabled={config.layers.length === 0 || isProcessing} 
                className={`flex items-center justify-center gap-1 shadow-sm px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-[9px] sm:text-[10px] font-extrabold shrink-0 whitespace-nowrap select-none ${config.layers.length === 0 ? 'bg-gray-150/20 dark:bg-gray-900/40 text-gray-400/50 cursor-not-allowed border border-gray-200/10' : 'bg-gradient-to-r from-pink-600 to-orange-500 text-white hover:scale-105 active:scale-95'}`}
              >
                  <ShoppingBag className="w-3 h-3 animate-pulse" />
                  <span>Continuar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Configuration Overlay */}
      <div className={`lg:hidden absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[90] max-h-[70vh] ${isLandscape ? 'origin-right' : 'origin-bottom'} ${
          isLandscape 
          ? `right-4 top-[80px] bottom-10 w-64 ${isMobilePanelOpen && mobileActiveTab ? 'translate-x-0 opacity-100 scale-100 pointer-events-auto' : 'translate-x-12 opacity-0 scale-95 pointer-events-none'}` 
          : `bottom-1 left-4 right-4 ${isMobilePanelOpen && mobileActiveTab ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`
      }`}>
          <div ref={mobileOverlayRef} className="w-full h-full rounded-2xl p-2.5 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar liquid-glass transition-all duration-500">
              <div className="flex justify-between items-center border-b border-gray-100/30 dark:border-gray-800/30 pb-1.5 shrink-0">
                  <h3 className="font-extrabold text-gray-750 dark:text-gray-200 uppercase text-[10px] tracking-wider leading-none">
                      {mobileActiveTab === 'product' && 'Prenda y Color'}
                      {mobileActiveTab === 'upload' && 'Tus Diseños'}
                      {mobileActiveTab === 'adjust' && 'Ajustes'}
                  </h3>
                  <button onClick={() => setMobileActiveTab(null)} className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 active:scale-95 transition-transform"><X className="w-4 h-4" /></button>
              </div>

              {mobileActiveTab === 'product' && (
                  <div className="flex flex-col gap-2.5 shrink-0">
                      <div className="flex p-0.5 bg-gray-100/60 dark:bg-gray-800/60 rounded-lg shrink-0">
                          <button onClick={() => setConfig(prev => {
                              if (!prev.productType || prev.productType === 'tshirt') {
                                return { ...prev, productType: 'tshirt', tshirtModelIndex: ((prev.tshirtModelIndex || 0) + 1) % TSHIRT_GLB_MODELS.length };
                              }
                              return { ...prev, productType: 'tshirt', tshirtModelIndex: 0, color: prev.color === 'bone' ? 'white' : prev.color };
                          })} className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${(!config.productType || config.productType === 'tshirt') ? 'bg-white/90 dark:bg-gray-700/90 shadow text-pink-500' : 'text-gray-400'}`}>👕 Camiseta {(config.tshirtModelIndex || 0) > 0 ? (config.tshirtModelIndex || 0) + 1 : ''}</button>
                          <button onClick={() => setConfig(prev => ({ ...prev, productType: 'totebag', color: 'bone' }))} className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${config.productType === 'totebag' ? 'bg-white/90 dark:bg-gray-700/90 shadow text-pink-500' : 'text-gray-400'}`}>👜 Tote Bag</button>
                      </div>
                      <div className="flex justify-center gap-3 py-1 shrink-0">
                          {config.productType === 'totebag' ? (
                               <div className="text-[10px] text-gray-500 font-bold px-3 py-1.5 bg-gray-100/40 dark:bg-gray-800/40 rounded-full">Color: Natural</div>
                          ) : (
                               <>
                               <button onClick={() => handleColorChange('white')} className={`w-7 h-7 rounded-full border-2 transition-all ${config.color === 'white' ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200'} bg-white shadow-sm`} />
                               <button onClick={() => handleColorChange('black')} className={`w-7 h-7 rounded-full border-2 transition-all ${config.color === 'black' ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-600'} bg-black shadow-sm`} />
                               </>
                          )}
                      </div>
                  </div>
              )}

              {mobileActiveTab === 'upload' && (
                  <div className="flex flex-col gap-2 shrink-0">
                      <div className="grid grid-cols-2 gap-2 shrink-0">
                          <div className={`border rounded-xl p-1 relative transition-all cursor-pointer ${activeLayerIndex === 0 && config.layers[0] ? 'border-pink-500 bg-pink-50/40 dark:bg-pink-900/10' : 'border-gray-200/50 dark:border-gray-700/50'}`} onClick={() => config.layers[0] && setActiveLayerIndex(0)}>
                              <input type="file" ref={fileInputRef1} onChange={(e) => { handleFileUpload(e, 0); setMobileActiveTab('adjust'); }} accept="image/*" className="hidden" />
                              {config.layers[0] ? (
                                  <div className="flex flex-col items-center gap-1 py-0.5">
                                      <img src={config.layers[0].textureUrl} className="w-7 h-7 object-contain bg-white rounded border border-gray-100" alt="Capa 1" />
                                      <button onClick={(e) => { e.stopPropagation(); removeLayer(0); }} className="text-red-500 text-[8px] bg-red-50/60 dark:bg-red-950/20 px-1 py-0.5 rounded-full font-bold">Borrar</button>
                                  </div>
                              ) : (
                                  <button onClick={() => fileInputRef1.current?.click()} className="w-full py-1 flex flex-col items-center text-gray-400 hover:text-pink-500"><Upload className="w-3.5 h-3.5" /><span className="text-[8px] font-bold mt-0.5">Subir #1</span></button>
                              )}
                          </div>
                          <div className={`border rounded-xl p-1 relative transition-all cursor-pointer ${activeLayerIndex === 1 && config.layers[1] ? 'border-pink-500 bg-pink-50/40 dark:bg-pink-900/10' : 'border-gray-200/50 dark:border-gray-700/50'}`} onClick={() => config.layers[1] && setActiveLayerIndex(1)}>
                              <input type="file" ref={fileInputRef2} onChange={(e) => { handleFileUpload(e, 1); setMobileActiveTab('adjust'); }} accept="image/*" className="hidden" />
                              {config.layers[1] ? (
                                  <div className="flex flex-col items-center gap-1 py-0.5">
                                      <img src={config.layers[1].textureUrl} className="w-7 h-7 object-contain bg-white rounded border border-gray-100" alt="Capa 2" />
                                      <button onClick={(e) => { e.stopPropagation(); removeLayer(1); }} className="text-red-500 text-[8px] bg-red-50/60 dark:bg-red-950/20 px-1 py-0.5 rounded-full font-bold">Borrar</button>
                                  </div>
                              ) : (
                                  <button onClick={() => fileInputRef2.current?.click()} disabled={!config.layers[0]} className={`w-full py-1 flex flex-col items-center ${!config.layers[0] ? 'text-gray-300 opacity-50' : 'text-gray-400 hover:text-pink-500'}`}><Upload className="w-3.5 h-3.5" /><span className="text-[8px] font-bold mt-0.5">Subir #2</span></button>
                              )}
                          </div>
                      </div>
                      {activeLayer && (
                           <button onClick={toggleLayerSide} className="w-full flex items-center justify-between px-2.5 py-1.5 bg-gray-50/30 dark:bg-gray-800/30 border border-gray-250/20 dark:border-gray-700/20 rounded-lg hover:border-pink-500 transition-colors shrink-0">
                              <span className="text-[9px] font-extrabold uppercase text-gray-500 dark:text-gray-400">Ubicación:</span>
                              <div className="flex items-center gap-1">
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${activeLayer.side === 'front' || !activeLayer.side ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Frente</span>
                                  <RefreshCw className="w-2.5 h-2.5 text-gray-400" />
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${activeLayer.side === 'back' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Espalda</span>
                              </div>
                           </button>
                      )}
                  </div>
              )}

              {mobileActiveTab === 'adjust' && activeLayer && (
                  <div className="flex flex-col gap-2 shrink-0">
                      <div className="space-y-0.5">
                          <span className="text-[8px] font-extrabold text-gray-400 uppercase">TAMAÑO</span>
                          <div className="flex items-center gap-2 bg-gray-50/40 dark:bg-gray-800/40 p-1 rounded-lg">
                              <ZoomOut className="w-3.5 h-3.5 text-gray-500" />
                              <input type="range" min={activeConstraints.scale.min} max={activeConstraints.scale.max} step="0.01" value={activeLayer.position.scale} onChange={(e) => setScaleValue(parseFloat(e.target.value))} className="w-full accent-pink-500 h-1 bg-gray-200 dark:bg-gray-750 rounded appearance-none cursor-pointer" />
                              <ZoomIn className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                      </div>
                      <div className="space-y-0.5">
                          <span className="text-[8px] font-extrabold text-gray-400 uppercase">TRANSPARENCIA ({Math.round((config.designOpacity ?? appearance.designOpacity) * 100)}%)</span>
                          <div className="flex items-center gap-2 bg-gray-50/40 dark:bg-gray-800/40 p-1 rounded-lg">
                              <span className="text-[8px] font-extrabold text-gray-400 uppercase flex items-center gap-1"><Hand className="w-3.5 h-3.5" /></span>
                              <input type="range" min="0.1" max="1" step="0.01" value={config.designOpacity ?? appearance.designOpacity} onChange={(e) => setConfig(prev => ({ ...prev, designOpacity: parseFloat(e.target.value) }))} className="w-full accent-pink-500 h-1 bg-gray-200 dark:bg-gray-750 rounded appearance-none cursor-pointer" />
                          </div>
                      </div>
                  </div>
              )}

              {mobileActiveTab === 'adjust' && !activeLayer && (
                  <p className="text-[10px] font-bold text-yellow-650 dark:text-yellow-400 text-center py-2 shrink-0">⚠️ Selecciona una imagen primero en "Diseño".</p>
              )}
          </div>
      </div>

      {/* Desktop Side Settings Panel */}
      <div className={`hidden lg:flex w-[420px] h-[calc(100vh-104px-40px)] mt-[104px] mb-[40px] flex-col p-4 bg-white/95 dark:bg-gray-950/95 border-l border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 shrink-0 ${isPanelHidden ? 'mr-[-420px] opacity-0 overflow-hidden pointer-events-none' : 'mr-0 opacity-100'}`}>
          <div className="flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar pr-1">
             <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2.5 shrink-0">
                 <div className="flex items-center gap-2">
                     <div className={`h-6 w-1 bg-gradient-to-b rounded-full ${isDesignerMode ? 'from-purple-500 to-indigo-500' : 'from-pink-500 to-orange-500'}`}></div>
                     <h2 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 uppercase tracking-wider">{isDesignerMode ? 'Diseñador' : 'Personalizar'}</h2>
                 </div>
                 <button 
                      onClick={() => setIsPanelHidden(true)}
                      className="p-1 rounded-full bg-gray-100 dark:bg-gray-850 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      title="Minimizar panel"
                 >
                     <X className="w-4 h-4" />
                 </button>
             </div>

            <div className="flex justify-center mt-2 mb-2">
                {config.productType === 'totebag' ? (
                     <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center shadow-sm border border-gray-200 dark:border-gray-700">
                         Color: Natural
                     </div>
                ) : (
                    <div className="flex gap-2">
                    <button
                        onClick={() => handleColorChange('white')}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all ${config.color === 'white' ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-gray-200'} bg-white shadow-sm`}
                        title="Blanco"
                    />
                    <button
                        onClick={() => handleColorChange('black')}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all ${config.color === 'black' ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-gray-600'} bg-black shadow-sm`}
                        title="Negro"
                    />
                    </div>
                )}
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 mt-2 mb-1">
            <button
                onClick={() => setConfig(prev => {
                    if (!prev.productType || prev.productType === 'tshirt') {
                        return { ...prev, productType: 'tshirt', tshirtModelIndex: ((prev.tshirtModelIndex || 0) + 1) % TSHIRT_GLB_MODELS.length };
                    }
                    return { ...prev, productType: 'tshirt', tshirtModelIndex: 0, color: prev.color === 'bone' ? 'white' : prev.color };
                })}
                className={`flex-1 py-1.5 text-xs lg:text-sm font-bold rounded-md transition-all ${(!config.productType || config.productType === 'tshirt') ? 'bg-white dark:bg-gray-700 shadow text-pink-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                👕 Camiseta {(config.tshirtModelIndex || 0) > 0 ? (config.tshirtModelIndex || 0) + 1 : ''}
            </button>
            <button
                onClick={() => setConfig(prev => ({ ...prev, productType: 'totebag', color: 'bone' }))}
                className={`flex-1 py-1.5 text-xs lg:text-sm font-bold rounded-md transition-all ${config.productType === 'totebag' ? 'bg-white dark:bg-gray-700 shadow text-pink-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                👜 Tote Bag
            </button>
        </div>

        <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Capas (Máx 2)
                </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div 
                    className={`border-2 rounded-xl p-2 relative transition-all cursor-pointer ${activeLayerIndex === 0 && config.layers[0] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => config.layers[0] && setActiveLayerIndex(0)}
                >
                    <input type="file" ref={fileInputRef1} onChange={(e) => handleFileUpload(e, 0)} accept="image/*" className="hidden" />
                    {config.layers[0] ? (
                        <div className="flex flex-col items-center gap-1">
                            <img src={config.layers[0].textureUrl} className="w-12 h-12 lg:w-16 lg:h-16 object-contain bg-white rounded border border-gray-200" alt="Capa 1" />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] lg:text-xs font-bold">Diseño 1</span>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(0); }} className="text-red-500 hover:text-red-700 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => fileInputRef1.current?.click()} className="w-full h-20 lg:h-24 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500">
                            <Upload className="w-5 h-5 lg:w-6 lg:h-6" />
                            <span className="text-[10px] lg:text-xs font-bold">Subir #1</span>
                        </button>
                    )}
                </div>

                <div 
                    className={`border-2 rounded-xl p-2 relative transition-all cursor-pointer ${activeLayerIndex === 1 && config.layers[1] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => config.layers[1] && setActiveLayerIndex(1)}
                >
                    <input type="file" ref={fileInputRef2} onChange={(e) => handleFileUpload(e, 1)} accept="image/*" className="hidden" />
                    {config.layers[1] ? (
                        <div className="flex flex-col items-center gap-1">
                            <img src={config.layers[1].textureUrl} className="w-12 h-12 lg:w-16 lg:h-16 object-contain bg-white rounded border border-gray-200" alt="Capa 2" />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] lg:text-xs font-bold">Diseño 2</span>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(1); }} className="text-red-500 hover:text-red-700 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => fileInputRef2.current?.click()} 
                            disabled={!config.layers[0]}
                            className={`w-full h-20 lg:h-24 flex flex-col items-center justify-center gap-2 ${!config.layers[0] ? 'opacity-50 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-pink-500'}`}
                        >
                            <Upload className="w-5 h-5 lg:w-6 lg:h-6" />
                            <span className="text-[10px] lg:text-xs font-bold">Subir #2</span>
                        </button>
                    )}
                </div>
            </div>
            
            {activeLayer && (
                <div className="mt-2">
                     <button
                        onClick={toggleLayerSide}
                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-500 dark:hover:border-pink-500 transition-colors group"
                     >
                        <div className="flex items-center gap-2">
                            <Shirt className="w-4 h-4 text-gray-500 group-hover:text-pink-500 transition-colors" />
                            <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Ubicación:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded transition-all ${activeLayer.side === 'front' || !activeLayer.side ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Frente</span>
                            <RefreshCw className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs font-bold px-2 py-0.5 rounded transition-all ${activeLayer.side === 'back' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Espalda</span>
                        </div>
                     </button>
                </div>
            )}
            
            {config.layers.length > 0 && !activeLayer && (
                <div className="text-xs text-center text-gray-400 italic">
                    Toca un diseño para editar
                </div>
            )}
        </div>

        {activeLayer && (
          <div className="space-y-4 lg:space-y-6 animate-fade-in border-t border-gray-100 dark:border-gray-800 pt-2 lg:pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                  <Move className="w-4 h-4" /> Mover (#{activeLayerIndex + 1})
                </label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsViewLocked(!isViewLocked)}
                        className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded transition-colors ${isViewLocked ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}
                    >
                        {isViewLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {isViewLocked ? 'Desbloquear' : 'Bloquear para Mover'}
                    </button>
                    <button 
                    onClick={centerImage}
                    className="text-[10px] text-pink-500 hover:text-pink-600 font-bold flex items-center gap-1 bg-pink-50 dark:bg-pink-900/10 px-2 py-1 rounded"
                    >
                    <RotateCcw className="w-3 h-3" /> CENTRAR
                    </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 w-28 mx-auto">
                <div />
                <button 
                  onClick={() => adjustPosition('y', 0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowUp className="w-4 h-4 mx-auto" />
                </button>
                <div />
                <button 
                  onClick={() => adjustPosition('x', -0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-4 h-4 mx-auto" />
                </button>
                <div className="flex items-center justify-center">
                    <LayoutTemplate className="w-4 h-4 text-gray-400" />
                </div>
                <button 
                  onClick={() => adjustPosition('x', 0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowRight className="w-4 h-4 mx-auto" />
                </button>
                <div />
                <button 
                  onClick={() => adjustPosition('y', -0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowDown className="w-4 h-4 mx-auto" />
                </button>
                <div />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                <ZoomIn className="w-4 h-4" /> Tamaño {constraintsLoaded && <span className="text-[10px] normal-case text-gray-300">(Mín: {activeConstraints.scale.min.toFixed(2)}, Máx: {activeConstraints.scale.max.toFixed(2)})</span>}
              </label>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                <button 
                  onClick={() => adjustScale(-0.05)}
                  className="p-1 text-gray-500 hover:text-pink-500 active:scale-95 transition-transform"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input 
                  type="range" 
                  min={activeConstraints.scale.min} 
                  max={activeConstraints.scale.max} 
                  step="0.01" 
                  value={activeLayer.position.scale}
                  onChange={(e) => setScaleValue(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <button 
                  onClick={() => adjustScale(0.05)}
                  className="p-1 text-gray-500 hover:text-pink-500 active:scale-95 transition-transform"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                  <Hand className="w-4 h-4" /> Transparencia
                </label>
                <span className="text-[10px] font-bold text-pink-500">{Math.round((config.designOpacity ?? appearance.designOpacity) * 100)}%</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.01" 
                  value={config.designOpacity ?? appearance.designOpacity}
                  onChange={(e) => setConfig(prev => ({ ...prev, designOpacity: parseFloat(e.target.value) }))}
                  className="w-full accent-pink-500 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <button 
                  onClick={() => {
                      if (onEditImage) {
                          onEditImage(activeLayerIndex);
                      }
                  }}
                  className="flex-1 py-3 bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/10 dark:hover:bg-pink-900/20 text-pink-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-pink-100 dark:border-pink-900/30"
                >
                  <Scissors className="w-4 h-4" /> Editar Imagen
                </button>
            </div>
            
            {isViewLocked && (
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                 <Video className="w-4 h-4" /> Ajustar Cámara
               </label>
               <div className="flex gap-2">
                 <button onClick={() => setCameraOffset(p => ({...p, y: p.y + 0.5}))} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">Subir</button>
                 <button onClick={() => setCameraOffset(p => ({...p, y: p.y - 0.5}))} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">Bajar</button>
               </div>
               <div className="flex gap-2 mt-2">
                 <button onClick={() => setCameraOffset(p => ({...p, zoom: p.zoom - 0.5}))} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">Acercar</button>
                 <button onClick={() => setCameraOffset(p => ({...p, zoom: p.zoom + 0.5}))} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">Alejar</button>
                 <button onClick={() => setCameraOffset({x:0, y:0, zoom:0})} className="ml-2 px-3 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 rounded-lg text-xs font-bold"><RefreshCw className="w-4 h-4" /></button>
               </div>
            </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          {isDesignerMode ? (
            <div className="space-y-3">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed text-justify">
                      Las imágenes que va a incluir en el diseño serán <strong>públicas</strong> para toda la comunidad. 
                      Evite compartir imágenes personales o sensibles. Su diseño será revisado por el admin y una vez aprobado estará disponible en la galería de la comunidad.
                  </p>
               </div>

               <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">Nombre del Diseño</label>
                  <input 
                    type="text" 
                    value={designName}
                    onChange={(e) => {
                        setDesignName(e.target.value);
                        setSaveError('');
                    }}
                    placeholder="Ej. Mi Obra Maestra"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                    disabled={isProcessing}
                  />
                  {saveError && (
                    <div className="flex items-start gap-2 mt-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <p>{saveError}</p>
                    </div>
                  )}
               </div>

               <button 
                onClick={handleAction}
                disabled={config.layers.length === 0 || isProcessing}
                className={`w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 ${config.layers.length === 0 || isProcessing ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                {isProcessing ? 'Guardando...' : 'GUARDAR EN GALERÍA'}
              </button>
            </div>
          ) : (
             <button 
                onClick={() => {
                   setContinueStep('options');
                   setShowContinueModal(true);
                }}
                disabled={config.layers.length === 0 || isProcessing}
                className={`w-full bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 ${config.layers.length === 0 || isProcessing ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Continuar</span>
              </button>
          )}
        </div>
      </div>
     </div>
     
     {/* Liquid Glass Dynamic SVG Filter Container */}
     <svg className="absolute w-0 h-0 pointer-events-none select-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
       <defs>
         <filter id="liquid-glass-refraction" x="-10%" y="-10%" width="120%" height="120%">
           <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
           <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -9" result="liquid_ripples" />
           <feDisplacementMap in="SourceGraphic" in2="liquid_ripples" scale="5" xChannelSelector="R" yChannelSelector="G" />
           <feComposite in2="SourceGraphic" operator="in" />
         </filter>
       </defs>
     </svg>

     {/* Continue Modal */}
     {showContinueModal && <ContinueModal />}

     {/* Styles for beautiful processing state and liquid glass styling */}
     <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loadingBar 2.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes elasticPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-elastic-pop {
          animation: elasticPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        /* Premium Liquid Glass styling with SVG refraction compatibility and light reflection layers */
        .liquid-glass {
          background: rgba(255, 255, 255, 0.45) !important;
          backdrop-filter: blur(20px) saturate(185%) url(#liquid-glass-refraction) !important;
          -webkit-backdrop-filter: blur(20px) saturate(185%) url(#liquid-glass-refraction) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.55) !important;
          box-shadow: 
            0 12px 35px -4px rgba(31, 38, 135, 0.12),
            inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.04) !important;
        }
        .dark .liquid-glass {
          background: rgba(10, 10, 15, 0.55) !important;
          backdrop-filter: blur(20px) saturate(185%) url(#liquid-glass-refraction) !important;
          -webkit-backdrop-filter: blur(20px) saturate(185%) url(#liquid-glass-refraction) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.09) !important;
          box-shadow: 
            0 12px 35px -4px rgba(0, 0, 0, 0.5),
            inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.25) !important;
        }
     `}</style>
    </div>
  );
};
