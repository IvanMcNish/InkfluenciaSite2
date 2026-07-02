import React, { useState } from "react";
import {
  ShoppingBag,
  Settings,
  Grid,
  LogOut,
  BarChart3,
  Layers,
  Users,
  Instagram,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { AdminFinancial } from "./admin/AdminFinancial";
import { AdminOrders } from "./admin/AdminOrders";
import { AdminInventory } from "./admin/AdminInventory";
import { AdminCustomers } from "./admin/AdminCustomers";
import { AdminGallery } from "./admin/AdminGallery";
import { AdminSettings } from "./admin/AdminSettings";
import { AdminCommunity } from "./admin/AdminCommunity";

import { CollectionItem, AdminTab } from "../types";

interface AdminPanelProps {
  onEditDesign: (design: CollectionItem) => void;
  initialTab?: AdminTab;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onEditDesign,
  initialTab = "financial",
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: "financial", label: "Finanzas", icon: BarChart3 },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "inventory", label: "Gestión Stock", icon: Layers },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "gallery", label: "Galería", icon: Grid },
    { id: "community", label: "Comunidad", icon: Instagram },
    { id: "settings", label: "Config", icon: Settings },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 md:h-[calc(100vh-85px)] md:flex md:flex-col min-w-0 w-full overflow-x-hidden">
      {/* SECCIÓN FIJA: Cabecera y Pestañas */}
      <div className="shrink-0 mb-4 z-10 min-w-0">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 min-w-0">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Panel Administrativo
            </h1>
            <div className="mt-2 text-left">
              <p className="text-gray-800 dark:text-gray-200 text-xs md:text-sm leading-relaxed px-5 py-2.5 rounded-2xl bg-white/40 dark:bg-black/30 border border-white/20 dark:border-white/5 backdrop-blur-md shadow-lg inline-block">
                Control de Pedidos y Base de Datos de Clientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 liquid-glass border border-white/20 dark:border-white/5 hover:scale-105 hover:text-red-500 text-gray-700 dark:text-gray-300 transition-all rounded-xl shadow-md font-bold text-sm"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* MOBILE & TABLET GRID MENU */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6 lg:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-white/20 dark:border-white/5 shadow-md backdrop-blur-md ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg"
                  : "bg-white/40 dark:bg-black/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 liquid-glass-accent"
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1.5" />
              <span className="text-center">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* DESKTOP TABS */}
        <div className="hidden lg:flex gap-2 mb-6 overflow-x-auto no-scrollbar p-2 rounded-2xl liquid-glass border border-white/20 dark:border-white/5 shadow-md w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN SCROLLABLE: Contenido */}
      <div className="md:flex-1 md:overflow-y-auto md:min-h-0 md:pr-1 pb-4 min-w-0 w-full overflow-x-hidden">
        {activeTab === "financial" && <AdminFinancial />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "inventory" && <AdminInventory />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "gallery" && (
          <AdminGallery onEditDesign={onEditDesign} />
        )}
        {activeTab === "community" && <AdminCommunity />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
};
