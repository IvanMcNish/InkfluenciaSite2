import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface LandingPageProps {
  isVisible: boolean;
  onStart: () => void;
}

const GALLERY_IMAGES = [
  '0286be87-5156-457a-aaf8-8e7cc832dae7.jpeg',
  '083dfc34-4ae7-4bb3-852f-32e58da41e2a.jpeg',
  '089243a2-7017-4e8d-9734-f17e30c73d5a.jpeg',
  '11291451-a9f9-4678-bd24-bb7df9db45c2.jpeg',
  '49d39c63-cc9a-4710-b1fe-72f6f9dd9bae.jpeg',
  '5079bdbb-0d61-4eae-8d16-a5756871b3bc.jpeg',
  '59a51c50-0631-4662-9aac-b7a053c52f61.jpeg',
  '63c35d46-77e0-4523-bfc9-4f8e31c0d56f.jpeg',
  '69d525d7-9f08-48f7-9323-ab142f1d8263.jpeg',
  '7037e718-2eb1-4faa-b8d3-1c37028eac4b.jpeg',
  '8062f9f3-ddad-4130-ad4d-8dc854d5c173.jpeg',
  '876238db-f683-47ec-a6cc-a78f20ab2083.jpeg',
  '8a884491-5780-4ec2-9035-b0ecd8f88f05.jpeg',
  'a6aeb6d9-94be-4995-967e-2360d08e4c7a.jpeg',
  'b3458334-9ee1-44a7-b4d3-27ce0673161b.jpeg',
  'be8c6089-ba4e-47c0-ba84-ba645bfb384e.jpeg',
  'c168095b-15c6-4630-b031-7fa2b6934c0d.jpeg',
  'd31d7f3b-f99a-4cb3-8372-a3a27f8efdde.jpeg',
  'dbfff92d-ffae-48bc-94c3-7955abfb6167.jpeg',
  'dde80793-5f12-48b6-baf3-6243c6f90856.jpeg',
  'dfb6c6bf-b1f3-405c-9e22-64034c82bd0d.jpeg',
  'e9c8d704-3ed6-4d97-a5e7-24f88d068de8.jpeg'
];

export const LandingPage: React.FC<LandingPageProps> = ({ isVisible, onStart }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) setShouldRender(true);
    else {
      const timer = setTimeout(() => setShouldRender(false), 1000); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    // Shuffle the unique design images on load to provide a dynamic random assortment without repeats
    const list = [...GALLERY_IMAGES];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setShuffledImages(list);
  }, []);

  if (!shouldRender) return null;

  // Duplicate the randomized list to ensure seamless endless ribbon animation wrapping
  const baseList = shuffledImages.length > 0 ? shuffledImages : GALLERY_IMAGES;
  const marqueeItems = [...baseList, ...baseList];

  return (
    <div 
      className={`absolute inset-0 z-40 flex flex-col bg-white/65 dark:bg-black/65 backdrop-blur-xl cursor-pointer overflow-hidden transition-all duration-1000 ease-in-out ${!isVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      onClick={onStart}
    >
      {/* Scope-specific CSS for smooth loop marquee and softened borders */}
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee-scroll 110s linear infinite;
          will-change: transform;
        }
        .marquee-mask {
          mask-image: linear-gradient(to right, transparent, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, transparent);
        }
        /* Custom non-border mask that makes images fade smoothly to transparent towards their outer edges */
        .seamless-transparent-edge {
          mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, transparent),
                      linear-gradient(to right, transparent, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, transparent);
          mask-composite: intersect;
          -webkit-mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, transparent),
                              linear-gradient(to right, transparent, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, transparent);
          -webkit-mask-composite: source-in;
        }
      `}</style>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-between text-center pt-[104px] md:pt-[120px] pb-24 md:pb-8 pointer-events-none overflow-hidden max-w-full">
        
        {/* Ribbon Marquee Section instead of Brand Logo */}
        <div className="w-full max-w-6xl mx-auto mb-4 md:mb-10 relative z-10 select-none pointer-events-none marquee-mask mt-4 md:mt-0 shrink-0">
          <div className="animate-marquee py-2 gap-3.5 md:gap-5">
            {marqueeItems.map((imgName, index) => (
              <div 
                key={`${imgName}-${index}`} 
                className="relative w-[7.3rem] h-[13rem] md:w-44 md:h-[19.5rem] flex-shrink-0 overflow-hidden"
              >
                {/* Individual Image with mask-image applying the seamless fade to transparent outer bounds */}
                <img 
                  src={`/Gallery/${imgName}`} 
                  alt="Colección Inkfluencia" 
                  className="w-full h-full object-cover seamless-transparent-edge"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Text Container aligned perfectly above the footer and below the marquee */}
        <div className="flex-1 flex flex-col items-center justify-center mt-auto">
          <div className="mt-2 md:mt-0 mb-2 md:mb-4 inline-block relative z-20 px-6">
            <span className="py-1 px-3 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-xs md:text-sm font-bold tracking-wide">
              NUEVA COLECCIÓN 2026
            </span>
          </div>
          
          <h1 className="text-2xl min-[360px]:text-3xl md:text-7xl font-black mb-2 md:mb-4 tracking-tight text-gray-900 dark:text-white relative z-20 px-6">
            Viste tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400">Influencia</span>.
          </h1>
          
          <p className="text-xs min-[360px]:text-sm md:text-lg text-gray-600 dark:text-gray-300 max-w-xl md:max-w-2xl leading-relaxed relative z-20 px-6 md:px-8">
            Camisetas personalizadas DTF en Bucaramanga. Diseños únicos elaborados con algodón peruano, colores vibrantes y tecnología 3D. Personaliza tu estilo con Inkfluencia desde 1 unidad y resalta en todo Santander.
          </p>

          <a
            href="https://kdddhfajdhwldgutzqbq.supabase.co/storage/v1/object/public/inkfluencia-images/LOGO/CATALOGO%20INKFLUENCIA.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="pointer-events-auto mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-orange-500 to-yellow-500 text-white font-extrabold uppercase text-xs tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-pink-500/25 flex items-center gap-2 border border-white/10 relative z-20"
          >
            <Download className="w-4 h-4 animate-bounce" />
            Descargar Catálogo
          </a>
        </div>
      </div>
    </div>
  );
};
