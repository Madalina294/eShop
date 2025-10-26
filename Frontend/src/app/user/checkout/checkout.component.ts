import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserStateService } from '../../services/user-state/user-state.service';
import { CheckoutService } from '../../services/checkout/checkout.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { UserService } from '../../services/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-checkout',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  checkoutForm!: FormGroup;
  cartItems = signal<any[]>([]);
  loading = signal(false);
  processing = signal(false);
  stripeInitialized = signal(false);
  
  @ViewChild('cardElement', { static: false }) cardElementRef!: ElementRef;

  // Computed pentru calcule
  subtotal = computed(() => {
    const items = this.cartItems();
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  });

  shippingCost = computed(() => {
    const method = this.checkoutForm?.get('shippingMethod')?.value;
    switch(method) {
      case 'FAN_COURIER': return 18;
      case 'SAME_DAY': return 20;
      case 'URGENT': return 35;
      default: return 15;
    }
  });

  totalAmount = computed(() => this.subtotal() + this.shippingCost());

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userStateService: UserStateService,
    private checkoutService: CheckoutService,
    private stripeService: StripeService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCartItems();
    this.initializeStripe();
    
    // Ascultă schimbările în metoda de plată
    this.checkoutForm.get('paymentMethod')?.valueChanges.subscribe(value => {
      if (value === 'CARD_ONLINE' && this.stripeInitialized()) {
        // Folosește requestAnimationFrame pentru a se asigura că DOM-ul este gata
        requestAnimationFrame(() => {
          this.setupStripeCardElement();
        });
      }
    });
  }

  ngAfterViewInit() {
    // ViewChild este disponibil aici
  }

  private initializeForm() {
    const user = this.userStateService.user();
    this.checkoutForm = this.fb.group({
      customerName: [user ? `${user.firstname} ${user.lastname}` : '', Validators.required],
      customerPhone: [user?.phoneNumber || '', Validators.required],
      customerEmail: [user?.email || '', [Validators.required, Validators.email]],
      shippingAddress: ['', Validators.required],
      billingAddress: [''],
      paymentMethod: ['CASH_ON_DELIVERY', Validators.required],
      shippingMethod: ['FAN_COURIER', Validators.required]
    });
  }

  private async loadCartItems() {
    this.loading.set(true);
    try {
      const items = await this.userService.getUserCart().toPromise();
      this.cartItems.set(items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      this.cartItems.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async initializeStripe() {
    try {
      await this.stripeService.initializeStripe();
      this.stripeInitialized.set(true);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
    }
  }

  private setupStripeCardElement() {
    // Verifică dacă elementul există deja
    const existingElement = document.querySelector('#card-element .StripeElement');
    if (existingElement) {
      existingElement.remove();
    }
    
    const cardElement = this.stripeService.createCardElement();
    
    if (cardElement) {
      const cardElementDiv = this.cardElementRef?.nativeElement;
      
      if (cardElementDiv) {
        // Golește complet containerul
        cardElementDiv.innerHTML = '';
        
        try {
          cardElement.mount(cardElementDiv);
          
          // Adaugă event listeners pentru erori
          cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (displayError) {
              if (event.error) {
                displayError.textContent = event.error.message;
              } else {
                displayError.textContent = '';
              }
            }
          });
        } catch (error) {
          console.error('Error mounting card element:', error);
        }
      } else {
        console.error('Card element div not found');
      }
    } else {
      console.error('Failed to create card element');
    }
  }

  async processOrder() {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.processing.set(true);

    try {
      if (this.checkoutForm.get('paymentMethod')?.value === 'CARD_ONLINE') {
        await this.processCardPayment();
      } else {
        await this.processCashOnDelivery();
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.processing.set(false);
    }
  }

  private async processCardPayment() {
    // Implementare pentru plată cu cardul
    const clientSecret = await this.checkoutService.createPaymentIntent(this.totalAmount()).toPromise();

    if (this.stripeService && clientSecret !== undefined) {
      const result = await this.stripeService.confirmPayment(clientSecret.clientSecret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === 'succeeded') {
        await this.createOrder(result.paymentIntent.id);
      }
    }
  }

  private async processCashOnDelivery() {
    await this.createOrder(null);
  }

  private async createOrder(paymentIntentId: string | null) {
    const items = this.cartItems();
    if (!items || items.length === 0) {
      throw new Error('No items in cart');
    }

    const orderData = {
      ...this.checkoutForm.value,
      paymentIntentId,
      cartItems: items
    };

    const order = await this.checkoutService.createOrder(orderData).toPromise();

    // Golește coșul
    await this.userService.clearCart().toPromise();

    // Redirecționează la confirmare
    if (order !== undefined)
      this.router.navigate(['/user/order-confirmation', order.orderId]);
  }

  private markFormGroupTouched() {
    Object.keys(this.checkoutForm.controls).forEach(key => {
      const control = this.checkoutForm.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(error: any) {
    console.error('Checkout error:', error);
    this.snackBar.open('Eroare la procesarea comenzii', 'OK');
  }

  goBack() {
    this.router.navigate(['/user/cart']);
  }
}
