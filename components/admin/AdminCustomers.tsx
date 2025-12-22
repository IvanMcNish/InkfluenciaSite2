import React, { useEffect, useState } from 'react';
import { Users, Search, User, Phone, MapPin } from 'lucide-react';
import { getCustomers } from '../../services/customerService';
import { Customer } from '../../types';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
      setIsLoading(false);
    };
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar cliente por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            />
        </div>

        {customers.length === 0 && !isLoading ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay clientes en la base de datos</h3>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white text-lg">{customer.name}</div>
                                    <div className="text-xs text-gray-500">Reg: {new Date(customer.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {customer.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {customer.phone}
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                                    <span className="text-xs">{customer.address}</span>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-between items-center text-xs">
                                <span className="text-gray-500 uppercase font-bold">Última compra</span>
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-medium">{new Date(customer.lastOrderAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Contacto</th>
                                    <th className="p-4">Ubicación</th>
                                    <th className="p-4">Última Compra</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                                                    <div className="text-xs text-gray-500">Registrado el {new Date(customer.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {customer.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {customer.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                                                <MapPin className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                                {customer.address}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                {new Date(customer.lastOrderAt).toLocaleDateString()}
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