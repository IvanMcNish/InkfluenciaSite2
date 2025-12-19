import React, { useEffect, useState } from 'react';
import { Instagram, Heart, MessageCircle, Share2, Loader2, ArrowRight, Camera } from 'lucide-react';
import { getInstagramPosts } from '../services/socialService';
import { InstagramPost } from '../types';

export const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      const data = await getInstagramPosts();
      setPosts(data);
      setIsLoading(false);
    };
    loadPosts();
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border border-white/30">
            <Instagram className="w-4 h-4" />
            <span>@inkfluencia_oficial</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            La Revolución <span className="text-yellow-300">#Inkfluencia</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            No solo creamos camisetas, creamos historias. Únete a nuestra comunidad, sube tu foto y etiquétanos para aparecer aquí.
          </p>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            <Camera className="w-5 h-5" />
            Subir mi Foto
          </a>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none group hover:-translate-y-2 transition-transform duration-300"
              >
                {/* Card Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                        <img 
                            src={post.userAvatar} 
                            alt={post.username} 
                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{post.username}</p>
                        <p className="text-xs text-gray-500">{post.timestamp}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Image */}
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img 
                        src={post.imageUrl} 
                        alt="Post" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay Icon on Hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Heart className="w-12 h-12 text-white fill-white drop-shadow-lg" />
                    </div>
                </div>

                {/* Actions & Caption */}
                <div className="p-4">
                    <div className="flex items-center gap-4 mb-3">
                        <button className="text-gray-800 dark:text-gray-200 hover:text-pink-500 transition-colors">
                            <Heart className="w-7 h-7" />
                        </button>
                        <button className="text-gray-800 dark:text-gray-200 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-7 h-7" />
                        </button>
                    </div>
                    
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                        {post.likes} Me gusta
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        <span className="font-bold mr-2 text-gray-900 dark:text-white">{post.username}</span>
                        {post.caption.split(' ').map((word, i) => (
                            word.startsWith('#') ? 
                            <span key={i} className="text-blue-600 dark:text-blue-400 font-medium">{word} </span> : 
                            <span key={i}>{word} </span>
                        ))}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¿Quieres aparecer aquí?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
                Sube una foto usando tu prenda Inkfluencia, etiquétanos y usa el hashtag <span className="font-bold text-pink-500">#inkfluencia</span>. ¡Seleccionamos las mejores cada semana!
            </p>
            <div className="flex justify-center gap-4">
                 <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                 </div>
                 <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-2xl">🏷️</span>
                 </div>
                 <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};