
import React, { useEffect, useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Camera, Upload, X, CheckCircle, Loader2, User, Sparkles, Instagram, ExternalLink } from 'lucide-react';
import { getInstagramPosts, createSocialPost } from '../services/socialService';
import { InstagramPost } from '../types';

export const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'form' | 'success'>('form');
  const [newPost, setNewPost] = useState({ username: '', caption: '', image: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      const data = await getInstagramPosts();
      setPosts(data);
      setIsLoading(false);
    };
    loadPosts();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert("La imagen es muy pesada. Máximo 5MB.");
              e.target.value = '';
              return;
          }

          e.target.value = '';

          const reader = new FileReader();
          reader.onload = () => {
              setNewPost({ ...newPost, image: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPost.image || !newPost.username) return;
      
      setIsSubmitting(true);
      const finalUsername = newPost.username.trim().replace(/\s+/g, '_').toLowerCase();

      const success = await createSocialPost({
          username: finalUsername,
          caption: newPost.caption,
          imageUrl: newPost.image,
          likes: 0,
          approved: false 
      });

      setIsSubmitting(false);
      
      if (success) {
          setUploadStep('success');
      } else {
          alert("Hubo un error al subir tu foto. Intenta nuevamente.");
      }
  };

  const closeAndReset = () => {
      setIsModalOpen(false);
      setTimeout(() => {
          setUploadStep('form');
          setNewPost({ username: '', caption: '', image: '' });
      }, 300);
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Upload Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
              <div className="liquid-glass-accent w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
                  <button onClick={closeAndReset} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"><X className="w-6 h-6"/></button>
                  
                  {uploadStep === 'form' ? (
                      <form onSubmit={handleSubmit}>
                          <h2 className="text-2.5xl font-black mb-1 flex items-center gap-2 text-gray-950 dark:text-white uppercase tracking-tight text-left"><Camera className="w-6 h-6 text-pink-500" /> Sube tu Look</h2>
                          <p className="text-xs text-zinc-700 dark:text-gray-300 mb-6 text-left">Comparte tu estilo Inkfluencia. Tu foto será revisada antes de publicarse automáticamente.</p>
                          
                          <div className="space-y-4">
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden bg-white/10 dark:bg-black/20 ${newPost.image ? 'border-pink-500 shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-pink-400'}`}
                              >
                                  {newPost.image ? (
                                      <img src={newPost.image} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                                  ) : (
                                      <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Toca para subir foto</span>
                                      </>
                                  )}
                                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                              </div>

                              <div className="text-left">
                                  <label className="text-xs font-black uppercase text-pink-500 ml-1 tracking-wider">Tu Nombre / Usuario</label>
                                  <input 
                                    type="text" 
                                    placeholder="ej. juan.estilo"
                                    required
                                    value={newPost.username}
                                    onChange={e => setNewPost({...newPost, username: e.target.value})}
                                    className="w-full p-3 rounded-xl glass-input outline-none text-zinc-950 dark:text-white font-medium"
                                  />
                              </div>

                              <div className="text-left">
                                  <label className="text-xs font-black uppercase text-pink-500 ml-1 tracking-wider">Mensaje (Caption)</label>
                                  <textarea 
                                    placeholder="Me encanta mi nueva camiseta..."
                                    rows={2}
                                    required
                                    value={newPost.caption}
                                    onChange={e => setNewPost({...newPost, caption: e.target.value})}
                                    className="w-full p-3 rounded-xl glass-input resize-none outline-none text-zinc-950 dark:text-white font-medium"
                                  />
                              </div>

                              <button 
                                type="submit" 
                                disabled={!newPost.image || isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-orange-500/20 transition-all cursor-pointer"
                              >
                                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Enviar a Revisión'}
                              </button>
                          </div>
                      </form>
                  ) : (
                      <div className="text-center py-8">
                          <div className="w-20 h-20 bg-green-100/80 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200/50">
                              <CheckCircle className="w-10 h-10 text-green-500" />
                          </div>
                          <h3 className="text-2xl font-black mb-2 text-zinc-950 dark:text-white uppercase tracking-tight">¡Gracias!</h3>
                          <p className="text-sm text-zinc-750 dark:text-gray-300 mb-6 leading-relaxed">Tu foto ha sido enviada al equipo de Inkfluencia. Una vez aprobada por nuestro equipo, aparecerá en la galería de la comunidad.</p>
                          <button onClick={closeAndReset} className="px-6 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black rounded-xl transition-transform hover:scale-105">Cerrar</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* HERO SECTION COMPACT WITH GRADIENT */}
      <div className="relative bg-gradient-to-r from-violet-600 to-orange-500 overflow-hidden shadow-lg border-b border-white/10">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10 mix-blend-overlay"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                <Sparkles className="w-3 h-3" /> Wall of Fame
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight drop-shadow-sm">
              Comunidad Inkfluencia
            </h1>
            
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed font-medium drop-shadow-sm">
              Únete a la revolución visual. Miles de clientes creando tendencias con sus diseños únicos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="group relative inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-3 rounded-full font-bold text-base shadow-xl hover:bg-gray-50 hover:scale-105 transition-all duration-300"
                >
                    <Camera className="w-5 h-5" />
                    Subir mi Foto
                </button>

                <a 
                    href="https://www.instagram.com/inkfluencia_/tagged/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white border border-white/30 px-6 py-3 rounded-full font-bold text-base backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                    <Instagram className="w-5 h-5" />
                    <span>Ver en Instagram</span>
                    <span className="opacity-70 text-xs font-normal bg-white/10 px-1.5 py-0.5 rounded ml-1">#inkfluencia</span>
                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
            </div>
        </div>
      </div>

      {/* GRID FEED (STANDARD SIZES) */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
          </div>
        ) : (
          <>
            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white dark:border-gray-800 shadow-xl">
                        <User className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Aún no hay publicaciones</h3>
                    <p className="text-gray-500 mt-2 mb-8">¡Sé el primero en estrenar el muro de la fama!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                    <div 
                        key={post.id} 
                        className="liquid-glass rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-pink-550/10 hover:-translate-y-1 transition-all duration-500 group flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between shrink-0 bg-white/20 dark:bg-black/20 border-b border-white/10 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                                    <img 
                                        src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=random&color=fff&bold=true`} 
                                        alt={post.username} 
                                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900 bg-white"
                                    />
                                </div>
                                <div className="text-left">
                                    <span className="block text-sm font-black text-gray-950 dark:text-white leading-none hover:underline cursor-pointer">
                                        {post.username}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 dark:text-gray-400 font-bold tracking-wider uppercase">Original de Inkfluencia</span>
                                </div>
                            </div>
                        </div>

                        {/* Image - Enforced Aspect Ratio for Uniformity */}
                        <div className="aspect-square relative overflow-hidden bg-gray-100/30 dark:bg-zinc-950/40">
                            <img 
                                src={post.imageUrl} 
                                alt="Post" 
                                className="w-full h-full object-cover transform group-hover:scale-102 transition-transform duration-700"
                            />
                            {/* Overlay Gradient on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 flex-1 flex flex-col justify-end bg-white/10 dark:bg-black/10">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex gap-4">
                                    <button className="group/btn cursor-pointer">
                                        <Heart className="w-6 h-6 text-gray-955 dark:text-white group-hover/btn:text-red-500 hover:scale-110 active:scale-90 transition-all" />
                                    </button>
                                    <button className="group/btn cursor-pointer">
                                        <MessageCircle className="w-6 h-6 text-gray-955 dark:text-white group-hover/btn:text-blue-500 hover:scale-110 active:scale-90 transition-all" />
                                    </button>
                                    <button className="group/btn cursor-pointer">
                                        <Send className="w-6 h-6 text-gray-955 dark:text-white group-hover/btn:text-green-500 hover:scale-110 active:scale-90 transition-all -rotate-45 mb-1" />
                                    </button>
                                </div>
                                <Bookmark className="w-6 h-6 text-gray-955 dark:text-white hover:text-yellow-500 hover:scale-110 active:scale-90 transition-all cursor-pointer" />
                            </div>

                            <div className="text-sm text-gray-950 dark:text-white font-black mb-2 text-left">
                                {post.likes > 0 ? `${post.likes} Me gusta` : 'Les gusta a inkfluencia_ y otros'}
                            </div>

                            <div className="text-sm text-zinc-900 dark:text-gray-250 leading-relaxed line-clamp-2 text-left">
                                <span className="font-extrabold text-gray-950 dark:text-white mr-2">{post.username}</span>
                                {post.caption}
                            </div>
                            
                            <div className="mt-3 text-[10px] text-zinc-500 dark:text-gray-400 uppercase tracking-wider font-bold text-left">
                                {post.timestamp}
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
