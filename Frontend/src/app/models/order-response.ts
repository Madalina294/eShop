export interface OrderResponse {
  orderId: number;
  status: string;
  message: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
}
