export interface CheckoutRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: 'CASH_ON_DELIVERY' | 'CARD_ONLINE';
  shippingMethod: 'FAN_COURIER' | 'SAME_DAY' | 'URGENT';
  cartItems: CartItemDto[];
}

export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  addedAt: string;
}
