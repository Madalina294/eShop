/** Mirrors the backend `OrderStatus` enum. */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/** Mirrors `OrderItemDto`. */
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** Mirrors `OrderDto`. */
export interface Order {
  id: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY' | 'CARD_ONLINE';
  shippingMethod: 'FAN_COURIER' | 'SAME_DAY' | 'URGENT';
  shippingAddress: string;
  billingAddress?: string | null;
  totalAmount: number;
  stripePaymentIntentId?: string | null;
  orderDate: string;
  deliveryDate?: string | null;
  orderItems: OrderItem[];
}

/** The happy path a parcel travels; `CANCELLED` is rendered on its own. */
export const ORDER_PROGRESS: readonly OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
];
