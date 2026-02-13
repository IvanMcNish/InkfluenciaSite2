
import React, { useState, useEffect, useRef } from 'react';
import { Instagram, ThumbsUp, Trash2, Check, X, Loader2, ImagePlus, User, MessageCircle, RefreshCw, CloudLightning } from 'lucide-react';
import { getAdminSocialPosts, updateSocialPostStatus, deleteSocialPost, createSocialPost } from '../../services/socialService';
import { InstagramPost } from '../../types';
import { supabase } from '../../lib/supabaseClient';

export const AdminCommunity: React.FC = () => {
    const [posts, setPosts] = useState<InstagramPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
    
    // Manual Add State
    const [isAdding, setIsAdding] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [newPost, setNewPost] = useState({ username: '', caption: '', image: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadPosts = async () => {
        setIsLoading(true);
        const data = await getAdminSocialPosts();
        setPosts(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handleApprove = async (id: string) => {
        const success = await updateSocialPostStatus(id, true);
        if (success) setPosts(prev => prev.map(p => p.id === id ? { ...p, approved: true } : p));
    };

    const handleReject = async (id: string) => {
        if (!confirm("¿Eliminar esta publicación?")) return;
        const success = await deleteSocialPost(id);
        if (success) setPosts(prev => prev.filter(p => p.id !== id));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPost({ ...newPost, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // --- NUEVA FUNCIÓN PARA LLAMAR A EDGE FUNCTION ---
    const handleSyncInstagram = async () => {
        setIsSyncing(true);
        try {
            const { data, error } = await supabase.functions.invoke('sync-instagram-hashtag', {
                body: { hashtag: 'inkfluencia' } // Puedes hacer esto dinámico si quieres
            });

            if (error) throw error;

            alert(`Sincronización completada. Se encontraron ${data?.count || 0} publicaciones nuevas.`);
            loadPosts(); // Recargar la lista
        } catch (err: any) {
            console.error('Error syncing:', err);
            alert(`Error al sincronizar: ${err.message || 'Verifica que la Edge Function esté desplegada y las variables de entorno configuradas.'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.image || !newPost.username) return;
        
        setIsAdding(true);
        const success = await createSocialPost({
            username: newPost.username,
            caption: newPost.caption,
            imageUrl: newPost.image,
            likes: Math.floor(Math.random() * 200) + 50, // Fake initial likes for manual posts
            approved: true
        });

        if (success) {
            setNewPost({ username: '', caption: '', image: '' });
            alert("Publicación agregada con éxito");
            loadPosts();
        } else {
            alert("Error al crear publicación");
        }
        setIsAdding(false);
    };

    const filteredPosts = posts.filter(p => activeTab === 'pending' ? !p.approved : p.approved);

    return (
        <div className="animate-fade-in space-y-6">
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex-1 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Instagram className="w-6 h-6 text-pink-500" />
                            Muro de Comunidad
                        </h2>
                        <button 
                            onClick={handleSyncInstagram}
                            disabled={isSyncing}
                            className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-70"
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudLightning className="w-4 h-4" />}
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar Instagram #Hashtag'}
                        </button>
                    </div>
                    
                    <form onSubmit={handleCreatePost} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">Agregar Publicación Manualmente</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors shrink-0 overflow-hidden relative"
                            >
                                {newPost.image ? (
                                    <img src={newPost.image} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <ImagePlus className="w-8 h-8 text-gray-400" />
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="@usuario_instagram" 
                                            value={newPost.username}
                                            onChange={e => setNewPost({...newPost, username: e.target.value})}
                                            className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Descripción / Caption..." 
                                            value={newPost.caption}
                                            onChange={e => setNewPost({...newPost, caption: e.target.value})}
                                            className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isAdding || !newPost.image}
                                    className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Instagram className="w-4 h-4" />}
                                    Publicar Manualmente
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* List Section */}
            <div>
                <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-800">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        Pendientes ({posts.filter(p => !p.approved).length})
                    </button>
                    <button 
                         onClick={() => setActiveTab('approved')}
                         className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'approved' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        Publicados ({posts.filter(p => p.approved).length})
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500"/></div>
                ) : filteredPosts.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 italic">No hay publicaciones en esta sección.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map(post => (
                            <div key={post.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="h-48 bg-gray-100 overflow-hidden relative group">
                                    <img src={post.imageUrl} alt={post.username} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    {/* Indicador de Origen */}
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                                        {post.id.length > 20 ? 'Instagram API' : 'Manual'}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">{post.username}</div>
                                            <div className="text-xs text-gray-500">{post.timestamp}</div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-pink-500">
                                            <ThumbsUp className="w-3 h-3" /> {post.likes}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 h-8">{post.caption}</p>
                                    
                                    <div className="flex gap-2">
                                        {!post.approved ? (
                                            <>
                                                <button onClick={() => handleApprove(post.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Aprobar</button>
                                                <button onClick={() => handleReject(post.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><X className="w-3 h-3" /> Rechazar</button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleReject(post.id)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
