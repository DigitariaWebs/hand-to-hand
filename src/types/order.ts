import { Product } from './product';
import { User } from './user';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'at_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type DeliveryMethod = 'direct' | 'hub' | 'courier' | 'pickup';

export type OrderItem = {
  productId: string;
  product: Pick<Product, 'id' | 'title' | 'images' | 'price'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type DeliveryAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  region: string;
  coordinates?: { lat: number; lng: number };
};

export type OrderTracking = {
  status: OrderStatus;
  message: string;
  location?: string;
  timestamp: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  buyer: Pick<User, 'id' | 'username' | 'avatar' | 'phone'>;
  seller: Pick<User, 'id' | 'username' | 'avatar' | 'phone'>;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  tracking: OrderTracking[];
  qrCode?: string;
  hubId?: string;
  transporterId?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
