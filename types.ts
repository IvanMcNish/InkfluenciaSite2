export interface Position {
  x: number;
  y: number;
  scale: number;
}

export interface TShirtConfig {
  color: 'white' | 'black';
  textureUrl: string | null;
  snapshotUrl?: string | null;
  position: Position;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped';

export interface Order {
  id: string;
  customerName: string;
  email: string;
  address: string;
  size: string;
  grammage: '150g' | '200g';
  config: TShirtConfig;
  total: number;
  date: string;
  status: OrderStatus;
}

export type ViewState = 'landing' | 'customizer' | 'checkout' | 'success' | 'admin';