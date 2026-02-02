
import { supabase } from '../lib/supabaseClient';
import { CustomizerConstraints, UploadLimits, AppearanceSettings, FinancialSettings } from '../types';

// Default values representing the "Printable Area" edges
// X: Wider range to allow small logos near armpits
// Y: Taller range to allow logos near neck or bottom
export const DEFAULT_CONSTRAINTS: CustomizerConstraints = {
    x: { min: -0.28, max: 0.28 }, 
    y: { min: -0.45, max: 0.35 },
    scale: { min: 0.05, max: 0.45 }
};

export const DEFAULT_UPLOAD_LIMITS: UploadLimits = {
    maxFileSizeMB: 5
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
    blackShirtHex: '#050505' // Default deep black
};

export const DEFAULT_FINANCIALS: FinancialSettings = {
    totalHistoricalInvestment: 0
};

// In-memory cache to prevent fetching on every Scene render (e.g. in lists)
let appearanceCache: AppearanceSettings | null = null;

export const getCustomizerConstraints = async (): Promise<CustomizerConstraints> => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('id', 'customizer_constraints')
            .single();

        if (error || !data) {
            console.warn("Using default constraints (DB entry not found)");
            return DEFAULT_CONSTRAINTS;
        }

        return data.value as CustomizerConstraints;
    } catch (e) {
        console.error("Error fetching constraints:", e);
        return DEFAULT_CONSTRAINTS;
    }
};

export const saveCustomizerConstraints = async (constraints: CustomizerConstraints): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                id: 'customizer_constraints',
                value: constraints
            });

        if (error) {
            console.error("Error saving constraints:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Exception saving constraints:", e);
        return false;
    }
};

export const getUploadLimits = async (): Promise<UploadLimits> => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('id', 'upload_limits')
            .single();

        if (error || !data) {
            return DEFAULT_UPLOAD_LIMITS;
        }

        return data.value as UploadLimits;
    } catch (e) {
        console.error("Error fetching upload limits:", e);
        return DEFAULT_UPLOAD_LIMITS;
    }
};

export const saveUploadLimits = async (limits: UploadLimits): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                id: 'upload_limits',
                value: limits
            });

        if (error) {
            console.error("Error saving upload limits:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Exception saving upload limits:", e);
        return false;
    }
};

export const getAppearanceSettings = async (forceRefresh = false): Promise<AppearanceSettings> => {
    if (appearanceCache && !forceRefresh) return appearanceCache;

    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('id', 'appearance_settings')
            .single();

        if (error || !data) {
            appearanceCache = DEFAULT_APPEARANCE;
            return DEFAULT_APPEARANCE;
        }

        appearanceCache = data.value as AppearanceSettings;
        return appearanceCache;
    } catch (e) {
        console.error("Error fetching appearance:", e);
        return DEFAULT_APPEARANCE;
    }
};

export const saveAppearanceSettings = async (settings: AppearanceSettings): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                id: 'appearance_settings',
                value: settings
            });

        if (error) {
            console.error("Error saving appearance:", error);
            return false;
        }
        // Update cache immediately
        appearanceCache = settings;
        return true;
    } catch (e) {
        console.error("Exception saving appearance:", e);
        return false;
    }
};

// --- FINANCIAL HISTORY FUNCTIONS ---

export const getFinancialSettings = async (): Promise<FinancialSettings> => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('id', 'financial_settings')
            .single();

        if (error || !data) {
            return DEFAULT_FINANCIALS;
        }
        return data.value as FinancialSettings;
    } catch (e) {
        console.error("Error fetching financial settings:", e);
        return DEFAULT_FINANCIALS;
    }
};

export const saveFinancialSettings = async (settings: FinancialSettings): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                id: 'financial_settings',
                value: settings
            });
        
        if (error) {
             console.error("Error saving financials:", error);
             return false;
        }
        return true;
    } catch (e) {
        console.error("Exception saving financials:", e);
        return false;
    }
};

export const addToHistoricalInvestment = async (amountToAdd: number): Promise<boolean> => {
    try {
        const currentSettings = await getFinancialSettings();
        const newTotal = (currentSettings.totalHistoricalInvestment || 0) + amountToAdd;
        
        return await saveFinancialSettings({
            totalHistoricalInvestment: newTotal
        });
    } catch (e) {
        console.error("Error adding to investment history:", e);
        return false;
    }
};
