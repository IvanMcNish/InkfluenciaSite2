import React, { useState } from 'react';
import { ShoppingBag, Settings, Grid, LogOut, BarChart3, Layers, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AdminFinancial } from './admin/AdminFinancial';
import { AdminOrders } from './admin/AdminOrders';
import { AdminInventory } from './admin/AdminInventory';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminGallery } from './admin/AdminGallery';
import { AdminSettings } from './admin/AdminSettings';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financial' | 'orders' | 'inventory' | 'customers' | 'gallery' | 'settings'>('financial');

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'financial', label: 'Finanzas', icon: BarChart3 },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'inventory', label: 'Gestión Stock', icon: Layers },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'gallery', label: 'Galería', icon: Grid },
    { id: 'settings', label: 'Config', icon: Settings },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 md:h-[calc(100vh-85px)] md:flex md:flex-col">
      {/* SECCIÓN FIJA: Cabecera y Pestañas */}
      <div className="shrink-0 mb-4 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Panel Administrativo</h1>
                <p className="text-gray-500 dark:text-gray-400">Control de Pedidos y Base de Datos de Clientes</p>
            </div>
            
            <div className="flex items-center gap-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 transition-colors rounded-lg font-bold text-sm"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
        </div>

        {/* MOBILE GRID MENU */}
        <div className="grid grid-cols-3 gap-2 mb-6 md:hidden">
            {tabs.map(tab => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                }`}
                >
                <tab.icon className="w-5 h-5 mb-1.5" />
                {tab.label}
                </button>
            ))}
        </div>

        {/* DESKTOP TABS */}
        <div className="hidden md:flex gap-4 mb-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* SECCIÓN SCROLLABLE: Contenido */}
      <div className="md:flex-1 md:overflow-y-auto md:min-h-0 md:pr-1 pb-4">
        {activeTab === 'financial' && <AdminFinancial />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'inventory' && <AdminInventory />}
        {activeTab === 'customers' && <AdminCustomers />}
        {activeTab === 'gallery' && <AdminGallery />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
};