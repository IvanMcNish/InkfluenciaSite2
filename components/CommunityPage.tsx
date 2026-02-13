
import React, { useEffect, useState, useRef } from 'react';
import { Instagram, Heart, MessageCircle, Share2, Loader2, ArrowRight, Camera, Upload, X, CheckCircle } from 'lucide-react';
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

  const instagramLink = "https://www.instagram.com/inkfluencia_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

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
          // Limit 5MB
          if (file.size > 5 * 1024 * 1024) {
              alert("La imagen es muy pesada. Máximo 5MB.");
              return;
          }
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
      
      // Ensure username has @
      let finalUsername = newPost.username.trim();
      if (!finalUsername.startsWith('@')) finalUsername = '@' + finalUsername;

      const success = await createSocialPost({
          username: finalUsername,
          caption: newPost.caption,
          imageUrl: newPost.image,
          approved: false // User posts require approval
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
    <div className="min-h-[calc(100vh-80px)]">
      {/* Upload Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-gray-200 dark:border-gray-800">
                  <button onClick={closeAndReset} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6"/></button>
                  
                  {uploadStep === 'form' ? (
                      <form onSubmit={handleSubmit}>
                          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><Camera className="w-6 h-6 text-pink-500" /> Sube tu Look</h2>
                          <p className="text-sm text-gray-500 mb-6">Comparte tu estilo Inkfluencia con la comunidad.</p>
                          
                          <div className="space-y-4">
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${newPost.image ? 'border-pink-500' : 'border-gray-300 dark:border-gray-700 hover:border-pink-400'}`}
                              >
                                  {newPost.image ? (
                                      <img src={newPost.image} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                                  ) : (
                                      <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm font-bold text-gray-500">Toca para subir foto</span>
                                      </>
                                  )}
                                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                              </div>

                              <div>
                                  <label className="text-xs font-bold uppercase text-gray-500 ml-1">Tu Usuario de Instagram</label>
                                  <input 
                                    type="text" 
                                    placeholder="@tu_usuario"
                                    required
                                    value={newPost.username}
                                    onChange={e => setNewPost({...newPost, username: e.target.value})}
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500"
                                  />
                              </div>

                              <div>
                                  <label className="text-xs font-bold uppercase text-gray-500 ml-1">Descripción (Opcional)</label>
                                  <textarea 
                                    placeholder="¡Me encanta mi nueva camiseta!"
                                    rows={2}
                                    value={newPost.caption}
                                    onChange={e => setNewPost({...newPost, caption: e.target.value})}
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                  />
                              </div>

                              <button 
                                type="submit" 
                                disabled={!newPost.image || isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Enviar para Aprobación'}
                              </button>
                          </div>
                      </form>
                  ) : (
                      <div className="text-center py-8">
                          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-10 h-10 text-green-500" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">¡Foto Recibida!</h3>
                          <p className="text-gray-500 mb-6">Tu publicación ha sido enviada a revisión. Una vez aprobada por el equipo, aparecerá en el muro.</p>
                          <button onClick={closeAndReset} className="px-6 py-2 bg-gray-100 dark:bg-gray-800 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border border-white/30">
            <Instagram className="w-4 h-4" />
            <span>@inkfluencia_</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            La Revolución <span className="text-yellow-300">#Inkfluencia</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            No solo creamos camisetas, creamos historias. Únete a nuestra comunidad, sube tu foto y etiquétanos para aparecer aquí.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
            >
                <Camera className="w-5 h-5" />
                Subir mi Foto
            </button>
            <a 
                href={instagramLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-black/20 text-white border border-white/30 hover:bg-black/30 px-8 py-3 rounded-full font-bold transition-all"
            >
                <Instagram className="w-5 h-5" />
                Ver en Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
        ) : (
          <>
            {posts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">Aún no hay publicaciones</h3>
                    <p className="text-gray-400 mt-2 mb-8">¡Sé el primero en subir tu foto!</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-pink-500 font-bold hover:underline">Subir Foto Ahora</button>
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
                                    src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=random`} 
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
          </>
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
