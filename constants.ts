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