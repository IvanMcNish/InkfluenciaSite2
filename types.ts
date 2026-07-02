
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
  side: TShirtSide;
  opacity?: number;
  rotation?: number; // New rotation in degrees (0-360)
  targetMesh?: 'basica_pecho' | 'basica_espalda' | 'basica_mangiz' | 'basica_mangder' | 'oversize_pecho' | 'oversize_espalda' | 'oversize_mangiz' | 'oversize_mangder'; // Target submesh for basica/oversize
<<<<<<< HEAD
  imageWidth?: number; // Original image width in pixels (for DEV HUD)
  imageHeight?: number; // Original image height in pixels (for DEV HUD)
=======
>>>>>>> 604436f51403413a97fd6b793c1c66751e6a00fb
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
  mask?: MaskType;
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
  productType?: 'basica' | 'oversize' | 'totebag' | 'tshirt'; // New property for product type
  tshirtModelIndex?: number;
  color: TShirtColor;
  designOpacity?: number; // Per-design opacity setting
  layers: DesignLayer[];
  snapshotUrl?: string | null;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped';
export type Gender = 'male' | 'female' | 'unisex';
export type TShirtColor = 'white' | 'black' | 'bone';
export type TShirtSide = 'front' | 'back';
export type MaskType = 'none' | 'circle' | 'square' | 'heart' | 'star' | 'hexagon' | 'triangle' | 'torn';
export type AdminTab = 'financial' | 'orders' | 'inventory' | 'customers' | 'gallery' | 'community' | 'settings';
export type GalleryTab = 'community' | 'catalog';

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
  color: TShirtColor;
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
    galleryCardScale?: number;
}

export interface FinancialSettings {
    totalHistoricalInvestment: number;
}

export type ViewState = 'landing' | 'customizer' | 'checkout' | 'success' | 'admin' | 'designer' | 'gallery' | 'track-order' | 'community' | 'contact' | 'image-editor';
