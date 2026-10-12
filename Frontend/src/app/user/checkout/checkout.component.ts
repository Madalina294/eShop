import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';

import { UserStateService } from '../../services/user-state/user-state.service';
import { UserService } from '../../services/user/user.service';
import { CheckoutService } from '../../services/checkout/checkout.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { ThemeService } from '../../services/theme/theme.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { CartStateService } from '../../shared/state/cart-state.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { CartItemDto, CheckoutRequest } from '../../models/checkout-request';
import { ViewState } from '../../models/ui-state';

type ShippingMethod = CheckoutRequest['shippingMethod'];
type PaymentMethod = CheckoutRequest['paymentMethod'];

interface ShippingOption {
  readonly value: ShippingMethod;
  readonly cost: number;
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly icon: string;
}

/**
 * Shipping options, matching the three values `CheckoutRequest` allows.
 *
 * The old component also carried a fourth `STANDARD` entry at 15 RON which was
 * never selectable and is not in the request type, yet it was the fallback for
 * the cost calculation — so an unknown method quietly priced an order at a
 * tariff the backend does not know.
 */
const SHIPPING_OPTIONS: readonly ShippingOption[] = [
  {
    value: 'FAN_COURIER',
    cost: 18,
    labelKey: 'checkout.shippingOptions.FAN_COURIER',
    descriptionKey: 'checkout.shippingDescriptions.FAN_COURIER',
    icon: 'local_shipping',
  },
  {
    value: 'SAME_DAY',
    cost: 20,
    labelKey: 'checkout.shippingOptions.SAME_DAY',
    descriptionKey: 'checkout.shippingDescriptions.SAME_DAY',
    icon: 'bolt',
  },
  {
    value: 'URGENT',
    cost: 35,
    labelKey: 'checkout.shippingOptions.URGENT',
    descriptionKey: 'checkout.shippingDescriptions.URGENT',
    icon: 'rocket_launch',
  },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PricePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatStepperModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userState = inject(UserStateService);
  private readonly userService = inject(UserService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly stripeService = inject(StripeService);
  private readonly themeService = inject(ThemeService);
  private readonly notifications = inject(NotificationService);
  private readonly cartState = inject(CartStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly shippingOptions = SHIPPING_OPTIONS;

  private readonly cardHost = viewChild<ElementRef<HTMLElement>>('cardHost');

  protected readonly state = signal<ViewState>('loading');
  protected readonly items = signal<CartItemDto[]>([]);
  protected readonly processing = signal(false);
  protected readonly stripeReady = signal(false);
  protected readonly cardError = signal<string | null>(null);

  private readonly user = this.userState.user();

  protected readonly contactForm = this.fb.nonNullable.group({
    customerName: [
      this.user ? `${this.user.firstname} ${this.user.lastname}`.trim() : '',
      [Validators.required, Validators.minLength(3)],
    ],
    customerPhone: [
      this.user?.phoneNumber ?? '',
      [Validators.required, Validators.pattern(/^[+\d][\d\s().-]{7,19}$/)],
    ],
    customerEmail: [this.user?.email ?? '', [Validators.required, Validators.email]],
  });

  protected readonly addressForm = this.fb.nonNullable.group({
    shippingAddress: ['', [Validators.required, Validators.minLength(10)]],
    billingAddress: [''],
    shippingMethod: ['FAN_COURIER' as ShippingMethod, Validators.required],
  });

  protected readonly paymentForm = this.fb.nonNullable.group({
    paymentMethod: ['CASH_ON_DELIVERY' as PaymentMethod, Validators.required],
  });

  private readonly shippingMethod = signal<ShippingMethod>('FAN_COURIER');
  protected readonly paymentMethod = signal<PaymentMethod>('CASH_ON_DELIVERY');

  protected readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.productPrice * item.quantity, 0)
  );

  protected readonly shippingCost = computed(
    () => SHIPPING_OPTIONS.find(o => o.value === this.shippingMethod())?.cost ?? 0
  );

  protected readonly totalAmount = computed(() => this.subtotal() + this.shippingCost());

  protected readonly totalUnits = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  protected readonly payingByCard = computed(() => this.paymentMethod() === 'CARD_ONLINE');

  constructor() {
    this.loadCart();

    // Mirror the two controls that drive pricing and the Stripe field into
    // signals, so the summary and the card mount react without manual wiring.
    this.addressForm.controls.shippingMethod.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.shippingMethod.set(value));

    this.paymentForm.controls.paymentMethod.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.paymentMethod.set(value));

    // Mount the card field once Stripe is ready, the host exists and the user
    // actually chose card. Re-runs on theme change so the iframe is restyled.
    effect(() => {
      const host = this.cardHost()?.nativeElement;
      const needsCard = this.payingByCard() && this.stripeReady();
      // Tracked so switching light/dark remounts with the new tokens.
      this.themeService.isDarkMode();

      if (!needsCard || !host) {
        this.stripeService.unmountCard();
        this.cardError.set(null);
        return;
      }

      const mounted = this.stripeService.mountCard(host, message => this.cardError.set(message));
      if (!mounted) this.notifications.error('checkout.errors.stripeUnavailable');
    });

    this.destroyRef.onDestroy(() => this.stripeService.unmountCard());
  }

  protected async loadCart(): Promise<void> {
    this.state.set('loading');

    try {
      const items = await firstValueFrom(this.userService.getUserCart());
      this.items.set((items ?? []) as CartItemDto[]);
      this.state.set(this.items().length ? 'ready' : 'empty');

      if (this.items().length) await this.prepareStripe();
    } catch {
      this.state.set('error');
    }
  }

  protected shippingOptionCost(option: ShippingOption): number {
    return option.cost;
  }

  /** Blocks the stepper's Next until the step's own fields are valid. */
  protected markStepTouched(step: 'contact' | 'address'): void {
    (step === 'contact' ? this.contactForm : this.addressForm).markAllAsTouched();
  }

  protected async placeOrder(): Promise<void> {
    this.contactForm.markAllAsTouched();
    this.addressForm.markAllAsTouched();

    if (this.contactForm.invalid || this.addressForm.invalid || this.paymentForm.invalid) {
      this.notifications.error('checkout.errors.formInvalid');
      return;
    }

    if (!this.items().length) {
      this.state.set('empty');
      return;
    }

    this.processing.set(true);

    try {
      const paymentIntentId = this.payingByCard() ? await this.payByCard() : null;
      await this.createOrder(paymentIntentId);
    } catch (error) {
      // Stripe's own messages are user-facing and already localised by Stripe.
      const message = error instanceof Error ? error.message : undefined;
      this.notifications.error('checkout.errors.orderFailed', message);
    } finally {
      this.processing.set(false);
    }
  }

  // --- Payment ---------------------------------------------------------------

  private async prepareStripe(): Promise<void> {
    this.stripeReady.set(await this.stripeService.initializeStripe());
  }

  /** Returns the PaymentIntent id on success, throws otherwise. */
  private async payByCard(): Promise<string> {
    const { clientSecret } = await firstValueFrom(
      this.checkoutService.createPaymentIntent(this.shippingMethod())
    );

    if (!clientSecret) throw new Error('Missing client secret');

    const result = await this.stripeService.confirmPayment(clientSecret);

    if (result.error) throw new Error(result.error.message);
    if (result.paymentIntent?.status !== 'succeeded') {
      throw new Error(`Payment status: ${result.paymentIntent?.status}`);
    }

    return result.paymentIntent.id;
  }

  private async createOrder(paymentIntentId: string | null): Promise<void> {
    const payload: CheckoutRequest & { paymentIntentId: string | null } = {
      ...this.contactForm.getRawValue(),
      ...this.addressForm.getRawValue(),
      ...this.paymentForm.getRawValue(),
      cartItems: this.items(),
      paymentIntentId,
    };

    const order = await firstValueFrom(this.checkoutService.createOrder(payload));

    // The order exists at this point; a failure to empty the cart must not
    // look like a failed order, so it is deliberately not awaited as fatal.
    try {
      await firstValueFrom(this.userService.clearCart());
    } catch {
      /* The backend clears it server-side too; the badge refresh below syncs. */
    }

    this.cartState.refreshCart();
    await this.router.navigate(['/user/order-confirmation', order.orderId]);
  }
}
