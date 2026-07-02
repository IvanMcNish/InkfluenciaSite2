import React from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoaderProps {
  message?: string;
}

export const LazyLoader: React.FC<LazyLoaderProps> = ({ message = 'Cargando...' }) => (
  <div className="flex flex-1 items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  </div>
);
