import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  PaymentIntentResult,
  Stripe,
  StripeCardElement,
  StripeCardElementOptions,
  StripeElements,
  loadStripe,
} from '@stripe/stripe-js';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly document = inject(DOCUMENT);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;
  private loading: Promise<Stripe | null> | null = null;

  /**
   * Loads Stripe.js once. Concurrent callers share the same promise, so a
   * component that initialises on both `ngOnInit` and a later retry does not
   * download the SDK twice.
   */
  async initializeStripe(): Promise<boolean> {
    if (this.stripe) return true;

    const key = environment.stripePublishableKey;
    if (!key || key.length < 10) {
      // Misconfiguration, not a user error — the caller shows the fallback.
      return false;
    }

    this.loading ??= loadStripe(key);
    this.stripe = await this.loading;

    if (!this.stripe) {
      this.loading = null;
      return false;
    }

    this.elements ??= this.stripe.elements();
    return true;
  }

  /**
   * Mounts a card input into `container`.
   *
   * Styling is read from the live CSS custom properties, so the field follows
   * the app's light/dark theme. The previous version hardcoded `#424770` on a
   * transparent background, which made typed card numbers nearly invisible in
   * dark mode.
   */
  mountCard(container: HTMLElement, onChange: (message: string | null) => void): boolean {
    if (!this.elements) return false;

    // Mounting twice into the same node duplicates the iframe.
    this.unmountCard();

    try {
      this.cardElement = this.elements.create('card', {
        style: this.themedStyle(),
        hidePostalCode: true,
      });

      this.cardElement.mount(container);
      this.cardElement.on('change', event => onChange(event.error?.message ?? null));
      return true;
    } catch {
      this.cardElement = null;
      return false;
    }
  }

  /** Must be called when the host component is destroyed. */
  unmountCard(): void {
    if (!this.cardElement) return;

    try {
      this.cardElement.unmount();
      this.cardElement.destroy();
    } catch {
      // Already detached — nothing to clean up.
    }

    this.cardElement = null;
  }

  async confirmPayment(clientSecret: string): Promise<PaymentIntentResult> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe is not initialised');
    }

    return this.stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: this.cardElement },
    });
  }

  /** Reads the current theme's tokens so the iframe matches the app. */
  private themedStyle(): StripeCardElementOptions['style'] {
    const root = this.document.documentElement;
    const styles = this.document.defaultView?.getComputedStyle(root);

    const token = (name: string, fallback: string) =>
      styles?.getPropertyValue(name).trim() || fallback;

    return {
      base: {
        color: token('--text-primary', '#0f172a'),
        fontFamily: token('--font-sans', 'Roboto, sans-serif'),
        fontSize: '16px',
        iconColor: token('--text-secondary', '#475569'),
        '::placeholder': { color: token('--text-disabled', '#94a3b8') },
      },
      invalid: {
        color: token('--error-500', '#ef4444'),
        iconColor: token('--error-500', '#ef4444'),
      },
    };
  }
}
