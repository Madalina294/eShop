import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environments';
import {OrderResponse, PaymentIntentResponse} from '../../models/order-response';
import {CheckoutRequest} from '../../models/checkout-request';
import {Order} from '../../models/order';


@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private apiUrl = `${environment.apiUrl}/checkout`;

  private readonly http = inject(HttpClient);

  createPaymentIntent(shippingMethod: string): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.apiUrl}/create-payment-intent`, { 
      shippingMethod 
    });
  }

  createOrder(orderData: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/create-order`, orderData);
  }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`);
  }

}
