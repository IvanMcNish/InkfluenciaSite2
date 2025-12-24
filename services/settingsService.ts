
import { supabase } from '../lib/supabaseClient';
import { CustomizerConstraints } from '../types';

// Default values representing the "Printable Area" edges
// X: Wider range to allow small logos near armpits
// Y: Taller range to allow logos near neck or bottom
export const DEFAULT_CONSTRAINTS: CustomizerConstraints = {
    x: { min: -0.28, max: 0.28 }, 
    y: { min: -0.45, max: 0.35 },
    scale: { min: 0.05, max: 0.45 }
};

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
