import React, { useEffect, useState } from 'react';
import { Grid, Search, Eye, Check, Trash2, CheckCircle2, AlertCircle, Loader2, Calendar, Layers, X } from 'lucide-react';
import { getAdminCollection, deleteDesignFromCollection, approveDesign } from '../../services/galleryService';
import { CollectionItem } from '../../types';

export const AdminGallery: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<CollectionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  const [previewDesign, setPreviewDesign] = useState<CollectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGallery = async () => {
    setIsLoading(true);
    const data = await getAdminCollection();
    setGalleryItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const requestDeleteGalleryItem = (id: string, name: string) => {
      setItemToDelete({ id, name });
  };

  const confirmDeleteGalleryItem = async () => {
      if (!itemToDelete) return;
      const { id } = itemToDelete;
      setItemToDelete(null); 
      setDeletingId(id); 
      
      try {
        const result = await deleteDesignFromCollection(id);
        if (result.success) {
            setGalleryItems(prev => prev.filter(item => item.id !== id));
        } else {
            alert(`NO SE PUDO ELIMINAR:\n${result.error}\n\nSolución: Ve a la pestaña 'Configuración' > copia el SQL de Galería > Ejecútalo en Supabase.`);
        }
      } catch (e) {
          alert("Error inesperado al intentar eliminar.");
      } finally {
          setDeletingId(null);
      }
  };

  const handleApproveDesign = async (id: string) => {
      setApprovingId(id);
      const success = await approveDesign(id);
      if (success) {
          setGalleryItems(prev => prev.map(item => item.id === id ? { ...item, approved: true } : item));
      } else {
          alert("Error al aprobar el diseño. Revisa la conexión.");
      }
      setApprovingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const DeleteConfirmationModal = () => {
      if (!itemToDelete) return null;
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Confirmar Eliminación</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    ¿Estás seguro que deseas eliminar el diseño <span className="font-bold text-gray-900 dark:text-white">"{itemToDelete.name}"</span>?
                    <br/><br/>
                    Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                    <button onClick={confirmDeleteGalleryItem} className="px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">Sí, Eliminar</button>
                </div>
            </div>
        </div>
      );
  }

  const GalleryPreviewModal = () => {
      if (!previewDesign) return null;
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl p-0 overflow-hidden border border-gray-200 dark:border-gray-800 relative">
                <button onClick={() => setPreviewDesign(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"><X className="w-5 h-5" /></button>
                <div className="bg-gray-100 dark:bg-gray-800 aspect-square flex items-center justify-center relative">
                    {previewDesign.config.snapshotUrl ? (
                        <img src={previewDesign.config.snapshotUrl} alt={previewDesign.name} className="w-full h-full object-cover" />
                    ) : <div className="text-gray-400 text-sm">Sin vista previa</div>}
                    {!previewDesign.approved && (
                        <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">Pendiente de Aprobación</div>
                    )}
                </div>
                <div className="p-6">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{previewDesign.name}</h3>
                    <div className="flex gap-4 text-sm text-gray-500 mb-6">
                        <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(previewDesign.createdAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1"><Layers className="w-4 h-4" />{previewDesign.config.layers.length} capas</div>
                    </div>
                    {!previewDesign.approved ? (
                        <div className="flex gap-3">
                            <button onClick={() => { handleApproveDesign(previewDesign.id); setPreviewDesign(null); }} disabled={approvingId === previewDesign.id} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20">{approvingId === previewDesign.id ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5"/>} Aprobar Diseño</button>
                            <button onClick={() => { requestDeleteGalleryItem(previewDesign.id, previewDesign.name); setPreviewDesign(null); }} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-red-600 font-bold py-3 rounded-xl transition-colors">Rechazar / Eliminar</button>
                        </div>
                    ) : (
                        <div className="w-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 py-3 rounded-xl font-bold text-center border border-green-100 dark:border-green-900 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Este diseño está público</div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="animate-fade-in">
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar diseño..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all" />
        </div>

        {itemToDelete && <DeleteConfirmationModal />}
        {previewDesign && <GalleryPreviewModal />}

        {galleryItems.length === 0 && !isLoading ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay diseños en la galería</h3>
            </div>
        ) : (
            <>
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {galleryItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex gap-4">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 relative">
                                {item.config.snapshotUrl ? <img src={item.config.snapshotUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>}
                                {!item.approved && <div className="absolute top-0 left-0 bg-yellow-400 text-[8px] font-bold px-1.5 py-0.5 text-yellow-900 uppercase">Pendiente</div>}
                            </div>
                            <div className="flex flex-col justify-between flex-1">
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">{item.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex flex-col"><span>{formatDate(item.createdAt)}</span></div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setPreviewDesign(item)} className="p-2 text-gray-600 bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                                    {!item.approved && <button onClick={() => handleApproveDesign(item.id)} className="p-2 text-white bg-green-500 rounded-lg">{approvingId === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}</button>}
                                    <button onClick={() => requestDeleteGalleryItem(item.id, item.name)} className="p-2 text-white bg-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="p-4">Vista Previa</th>
                                    <th className="p-4">Nombre / Detalles</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Fecha Creación</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {galleryItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                {item.config.snapshotUrl ? <img src={item.config.snapshotUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white mb-1">{item.name}</div>
                                            <div className="text-xs text-gray-500 flex flex-col gap-1"><span>Color: <span className="capitalize">{item.config.color === 'white' ? 'Blanca' : 'Negra'}</span></span><span>Capas: {item.config.layers.length}</span></div>
                                        </td>
                                        <td className="p-4">
                                            {item.approved ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3" /> Aprobado</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertCircle className="w-3 h-3" /> Pendiente</span>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(item.createdAt)}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setPreviewDesign(item)} className="p-1.5 text-gray-500 hover:text-blue-500 bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Vista Previa"><Eye className="w-4 h-4" /></button>
                                                {!item.approved && <button onClick={() => handleApproveDesign(item.id)} disabled={approvingId === item.id} className="p-1.5 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded-lg transition-colors" title="Aprobar Diseño">{approvingId === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}</button>}
                                                <button onClick={() => requestDeleteGalleryItem(item.id, item.name)} disabled={deletingId === item.id} className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors" title="Eliminar">{deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};