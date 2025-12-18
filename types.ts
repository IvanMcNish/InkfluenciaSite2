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

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  size: string;
  grammage: '150g' | '200g';
  config: TShirtConfig;
  total: number;
  date: string;
  status: OrderStatus;
}

export interface CollectionItem {
  id: string;
  name: string;
  config: TShirtConfig;
  createdAt: string;
}

export type ViewState = 'landing' | 'customizer' | 'checkout' | 'success' | 'admin' | 'designer' | 'gallery';