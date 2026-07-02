import { useState, useEffect, useCallback } from 'react';
import {
  getAppearanceSettings,
  getCustomizerConstraints,
  getToteCustomizerConstraints,
  getUploadLimits,
  DEFAULT_APPEARANCE,
  DEFAULT_CONSTRAINTS,
  DEFAULT_TOTE_CONSTRAINTS,
  DEFAULT_UPLOAD_LIMITS,
} from '../services/settingsService';
import {
  AppearanceSettings,
  CustomizerConstraints,
  UploadLimits,
} from '../types';

interface AppSettings {
  appearance: AppearanceSettings;
  constraints: CustomizerConstraints;
  toteConstraints: CustomizerConstraints;
  uploadLimits: UploadLimits;
}

interface UseAppSettingsResult extends AppSettings {
  loading: boolean;
  error: string | null;
  refresh: (forceRefresh?: boolean) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  appearance: DEFAULT_APPEARANCE,
  constraints: DEFAULT_CONSTRAINTS,
  toteConstraints: DEFAULT_TOTE_CONSTRAINTS,
  uploadLimits: DEFAULT_UPLOAD_LIMITS,
};

export const useAppSettings = (): UseAppSettingsResult => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga todos los settings en paralelo con Promise.all para minimizar round-trips
  const refresh = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const [appearance, constraints, toteConstraints, uploadLimits] = await Promise.all([
        getAppearanceSettings(forceRefresh),
        getCustomizerConstraints(),
        getToteCustomizerConstraints(),
        getUploadLimits(),
      ]);
      setSettings({ appearance, constraints, toteConstraints, uploadLimits });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar configuración';
      setError(message);
      // Ante un error, mantenemos los defaults para que la app siga funcionando
      setSettings(DEFAULT_SETTINGS);
      console.error('[useAppSettings]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...settings,
    loading,
    error,
    refresh,
  };
};
