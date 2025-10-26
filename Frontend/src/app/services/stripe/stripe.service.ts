import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import {environment} from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  async initializeStripe(): Promise<void> {
    this.stripe = await loadStripe(environment.stripePublishableKey);
    if (this.stripe) {
      this.elements = this.stripe.elements();
    }
  }

  createCardElement(): StripeCardElement | null {
    if (this.elements) {
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
        },
      });
    }
    return this.cardElement;
  }

  async confirmPayment(clientSecret: string): Promise<any> {
    if (this.stripe && this.cardElement) {
      return await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
        }
      });
    }
    throw new Error('Stripe not initialized');
  }
}
