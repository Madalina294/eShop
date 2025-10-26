import {Component, OnInit, signal} from '@angular/core';
import {UserService} from '../../services/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-cart',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit{
  cartItems = signal<any[]>([]);
  loading = signal(false);
  totalPrice = signal(0);

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart(){
    this.loading.set(true);
    this.userService.getUserCart().subscribe({
      next: value => {
        this.loading.set(false);
        this.cartItems.set(value);
        this.calculateTotal();
      },
      error: err => {
        this.loading.set(false);
        console.error('Error loading cart:', err);
        const message = this.translate.instant('cart.errors.loadingFailed');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    })
  }

  getProductImage(item: any): string {
    if (item.productImage) {
      if (item.productImage.startsWith('/')) {
        return `http://localhost:8080${item.productImage}`;
      }
      return `http://localhost:8080/${item.productImage}`;
    }
    return 'user.png'; // Fallback image
  }

  removeFromCart(productId: number, event: Event) {
    event.stopPropagation();

    this.userService.removeFromCart(productId).subscribe({
      next: () => {
        this.cartItems.update(items =>
          items.filter(item => item.productId !== productId)
        );
        this.calculateTotal();
        const message = this.translate.instant('cart.removed');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      },
      error: (err) => {
        console.error('Error removing from cart:', err);
        const message = this.translate.instant('cart.removeError');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    });
  }

  updateQuantity(productId: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromCart(productId, new Event('click'));
      return;
    }

    this.userService.updateCartItemQuantity(productId, newQuantity).subscribe({
      next: () => {
        this.cartItems.update(items =>
          items.map(item =>
            item.productId === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
        this.calculateTotal();
        const message = this.translate.instant('cart.quantityUpdated');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 2000});
      },
      error: (err) => {
        console.error('Error updating quantity:', err);
        const message = this.translate.instant('cart.updateError');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    });
  }

  calculateTotal() {
    const total = this.cartItems().reduce((sum, item) => {
      return sum + (item.productPrice * item.quantity);
    }, 0);
    this.totalPrice.set(total);
  }

  goToViewProduct(productId: number) {
    this.router.navigate(['/user/view-product'], {
      queryParams: { id: productId }
    });
  }

  goToAllProducts() {
    this.router.navigate(['/user/all-products']);
  }

  clearCart() {
    this.userService.clearCart().subscribe({
      next: () => {
        this.cartItems.set([]);
        this.totalPrice.set(0);
        const message = this.translate.instant('cart.cleared');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      },
      error: (err) => {
        console.error('Error clearing cart:', err);
        const message = this.translate.instant('cart.clearError');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    });
  }

  proceedToCheckout() {
    this.router.navigate(['/user/checkout']);
  }

  totalProducts(cartItems: any[]) {
    return this.cartItems().reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);
  }
}
