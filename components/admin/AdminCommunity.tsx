
import React, { useState, useEffect, useRef } from 'react';
import { Instagram, Trash2, Check, X, Loader2, ImagePlus, User, MessageCircle, MoreHorizontal } from 'lucide-react';
import { getAdminSocialPosts, updateSocialPostStatus, deleteSocialPost, createSocialPost } from '../../services/socialService';
import { InstagramPost } from '../../types';

export const AdminCommunity: React.FC = () => {
    const [posts, setPosts] = useState<InstagramPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
    
    // Manual Add State
    const [isAdding, setIsAdding] = useState(false);
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
        if (!confirm("¿Eliminar permanentemente esta publicación?")) return;
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

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.image || !newPost.username) return;
        
        setIsAdding(true);
        const success = await createSocialPost({
            username: newPost.username,
            caption: newPost.caption,
            imageUrl: newPost.image,
            likes: Math.floor(Math.random() * 200) + 50, // Fake initial likes for manual admin posts
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
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Instagram className="w-6 h-6 text-pink-500" />
                            Gestión de Comunidad (Fotos de Clientes)
                        </h2>
                    </div>
                    
                    <form onSubmit={handleCreatePost} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">Publicar como Admin</h3>
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
                                            placeholder="Nombre del cliente..." 
                                            value={newPost.username}
                                            onChange={e => setNewPost({...newPost, username: e.target.value})}
                                            className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Descripción / Caption..." 
                                            value={newPost.caption}
                                            onChange={e => setNewPost({...newPost, caption: e.target.value})}
                                            className="w-full pl-10 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isAdding || !newPost.image}
                                    className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                                    Publicar y Aprobar
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
                        className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                    >
                        Pendientes de Aprobación ({posts.filter(p => !p.approved).length})
                    </button>
                    <button 
                         onClick={() => setActiveTab('approved')}
                         className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'approved' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                    >
                        Publicados en Web ({posts.filter(p => p.approved).length})
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500"/></div>
                ) : filteredPosts.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 italic bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        No hay publicaciones en esta sección.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map(post => (
                            <div key={post.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                                {/* Simulated Instagram Card Header */}
                                <div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                                            <img 
                                                src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=random&color=fff`} 
                                                alt={post.username} 
                                                className="w-full h-full rounded-full object-cover border border-white dark:border-gray-900 bg-white"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {post.username}
                                        </span>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                                    <img src={post.imageUrl} alt={post.username} className="w-full h-full object-cover" />
                                </div>
                                
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="text-sm text-gray-500 mb-4 flex-1">
                                        <span className="font-bold text-gray-900 dark:text-white mr-1">{post.username}</span>
                                        <span className="text-gray-800 dark:text-gray-300">{post.caption}</span>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-auto">
                                        {!post.approved ? (
                                            <>
                                                <button onClick={() => handleApprove(post.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-lg shadow-green-500/20"><Check className="w-3 h-3" /> Aprobar</button>
                                                <button onClick={() => handleReject(post.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><X className="w-3 h-3" /> Rechazar</button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleReject(post.id)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><Trash2 className="w-3 h-3" /> Eliminar del Muro</button>
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
