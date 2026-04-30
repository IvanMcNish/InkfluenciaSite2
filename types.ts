
export interface Position {
  x: number;
  y: number;
  scale: number;
}

export interface DesignLayer {
  id: string;
  textureUrl: string;
  originalUrl?: string; // Store original for re-editing
  position: Position;
  side: 'front' | 'back';
  opacity?: number;
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
    hueRotation?: number;
    tint?: string;
    noise?: number;
    vignette?: number;
    lightLeak?: number;
    grime?: number;
  };
  mask?: 'none' | 'circle' | 'square' | 'heart' | 'star' | 'hexagon' | 'triangle' | 'torn';
  maskScale?: number;
  chromaKey?: {
    enabled: boolean;
    color: string;
    tolerance: number;
  };
}

export interface TShirtConfig {
  id?: string; // Reference for editing existing designs
  designName?: string; // Temporary name storage for editing
  productType?: 'tshirt' | 'totebag'; // New property for product type
  color: 'white' | 'black' | 'bone';
  designOpacity?: number; // Per-design opacity setting
  layers: DesignLayer[];
  snapshotUrl?: string | null;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped';
export type Gender = 'male' | 'female' | 'unisex';

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  size: string;
  gender: Gender;
  grammage: '150g' | '200g' | 'tote';
  config: TShirtConfig;
  total: number;
  date: string;
  status: OrderStatus;
  adminDiscountApplied?: boolean; // New field for admin discount logic
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lastOrderAt: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  gender: Gender;
  color: 'white' | 'black' | 'bone';
  size: string;
  grammage: '150g' | '200g' | 'tote';
  quantity: number;
}

export interface CollectionItem {
  id: string;
  name: string;
  config: TShirtConfig;
  createdAt: string;
  approved: boolean; // Moderation flag
}

export interface InstagramPost {
  id: string;
  username: string;
  userAvatar?: string;
  imageUrl: string;
  likes: number;
  caption: string;
  timestamp: string; // Display string or date
  createdAt: string; // ISO DB Date
  approved: boolean;
}

export interface CustomizerConstraints {
    x: { min: number, max: number };
    y: { min: number, max: number };
    scale: { min: number, max: number };
}

export interface UploadLimits {
    maxFileSizeMB: number;
}

export interface AppearanceSettings {
    blackShirtHex: string;
    designOpacity: number;
}

export interface FinancialSettings {
    totalHistoricalInvestment: number;
}

export type ViewState = 'landing' | 'customizer' | 'checkout' | 'success' | 'admin' | 'designer' | 'gallery' | 'track-order' | 'community' | 'contact';
