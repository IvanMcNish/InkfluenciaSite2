
export const TSHIRT_OBJ_URL = "https://raw.githubusercontent.com/IvanMcNish/camiseta/refs/heads/main/T-shirt-male-obj.obj";

export const DEFAULT_CONFIG = {
  color: 'white' as const,
  layers: [], // Empty array for layers
  snapshotUrl: null
};

export const PRICES = {
  '150g': 50000,
  '200g': 65000
};

// Costos de producción para valoración de inventario
export const INVENTORY_COSTS = {
  XS_ALL: 15000, // Precio único para cualquier camiseta XS
  male: {
    '150g': 18000,
    '200g': 24000
  },
  female: {
    '150g': 17000,
    '200g': 22000
  }
};

// Helper para calcular costo de una unidad específica
export const getItemCost = (gender: string, size: string, grammage: string) => {
  // Rule 1: XS Size override (regardless of gender or grammage)
  if (size === 'XS') {
    return INVENTORY_COSTS.XS_ALL;
  } 
  
  // Rule 2: Gender & Grammage logic
  // Safe check for gender (default to male if missing/invalid)
  const genderKey = gender === 'female' ? 'female' : 'male';
  // Safe check for grammage
  const grammageKey = grammage === '200g' ? '200g' : '150g';
  
  return INVENTORY_COSTS[genderKey][grammageKey];
};

export const SHIPPING = 10000; // COP

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
