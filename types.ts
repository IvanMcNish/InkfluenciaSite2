
export interface Position {
  x: number;
  y: number;
  scale: number;
}

export interface DesignLayer {
  id: string;
  textureUrl: string;
  position: Position;
}

export interface TShirtConfig {
  color: 'white' | 'black';
  layers: DesignLayer[];
  snapshotUrl?: string | null;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped';
export type Gender = 'male' | 'female';

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  size: string;
  gender: Gender;
  grammage: '150g' | '200g';
  config: TShirtConfig;
  total: number;
  date: string;
  status: OrderStatus;
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
  color: 'white' | 'black';
  size: string;
  grammage: '150g' | '200g';
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
  userAvatar: string;
  imageUrl: string;
  likes: number;
  caption: string;
  timestamp: string;
}

export type ViewState = 'landing' | 'customizer' | 'checkout' | 'success' | 'admin' | 'designer' | 'gallery' | 'track-order' | 'community' | 'contact';
