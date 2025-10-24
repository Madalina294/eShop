import {Component, OnInit, signal} from '@angular/core';
import {ProductData} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user/user.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-view-product',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss'
})
export class ViewProductComponent implements OnInit{
  loading = signal(false);
  isInWishlist = signal(false);
  selectedQuantity = 1;
  product = signal<ProductData> ({
    id: 0,
    name: '',
    price: 0,
    description: '',
    categoryId: 0,
    color: '',
    dimensions: '',
    material: '',
    weight: '',
    quantity: 0
  });

  constructor(private snackBar: MatSnackBar,
               private router: Router,
               private userService: UserService,
              private route: ActivatedRoute,
              private translate: TranslateService) {
  }

  ngOnInit(){
    this.loadProductData();
  }

  loadProductData(){
    this.loading.set(true);
    const productId = this.route.snapshot.queryParams['id'];

    console.log('=== DEBUG: ViewProductComponent ===');
    console.log('Query params:', this.route.snapshot.queryParams);
    console.log('Product ID:', productId);
    console.log('=== END DEBUG ===');

    if (!productId) {
      this.loading.set(false);
      const message = this.translate.instant('viewProduct.errors.productIdNotFound');
      const action = this.translate.instant('viewProduct.errors.ok');
      this.snackBar.open(message, action, {duration: 3000});
      this.router.navigate(['/user/all-products']);
      return;
    }

    this.userService.getProduct(productId).subscribe({
      next: value => {
        this.loading.set(false);
        this.product.set(value);

        this.checkWishlistStatus(productId);
      },
      error: err => {
        this.loading.set(false);
        console.error('Error loading product:', err);
        const message = this.translate.instant('viewProduct.errors.loadingFailed');
        const action = this.translate.instant('viewProduct.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    })
  }

  checkWishlistStatus(productId: number) {
    this.userService.checkIfInWishlist(productId).subscribe({
      next: (isInWishlist: boolean) => {
        this.isInWishlist.set(isInWishlist);
      },
      error: (err) => {
        console.error('Error checking wishlist status:', err);
        this.isInWishlist.set(false);
      }
    });
  }

  getProductImage(product: ProductData): string {
    if (product.image) {
      // Verifică dacă path-ul începe deja cu /
      if (product.image.startsWith('/')) {
        return `http://localhost:8080${product.image}`;
      }
      return `http://localhost:8080/${product.image}`;
    }
    return 'user.png';
  }

  addToCart(productId: number, quantity: number = this.selectedQuantity) {
    if (quantity <= 0) {
      const message = this.translate.instant('cart.invalidQuantity');
      const action = this.translate.instant('cart.errors.ok');
      this.snackBar.open(message, action, {duration: 3000});
      return;
    }

    if (quantity > this.product().quantity) {
      const message = this.translate.instant('cart.quantityExceedsStock');
      const action = this.translate.instant('cart.errors.ok');
      this.snackBar.open(message, action, {duration: 3000});
      return;
    }

    this.userService.addToCart(productId, quantity).subscribe({
      next: () => {
        const message = this.translate.instant('cart.addedToCart');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        const message = this.translate.instant('cart.addError');
        const action = this.translate.instant('cart.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    });
  }

  updateQuantity(quantity: number) {
    if (quantity < 1) {
      this.selectedQuantity = 1;
    } else if (quantity > this.product().quantity) {
      this.selectedQuantity = this.product().quantity;
    } else {
      this.selectedQuantity = quantity;
    }
  }

  addToWishList(productId: number){
    if (this.isInWishlist()) {
      // Produsul este deja în wishlist, îl eliminăm
      this.userService.removeFromWishlist(productId).subscribe({
        next: () => {
          this.isInWishlist.set(false);
          const message = this.translate.instant('viewProduct.wishlist.removed');
          const action = this.translate.instant('viewProduct.errors.ok');
          this.snackBar.open(message, action, {duration: 3000});
        },
        error: (err) => {
          console.error('Error removing from wishlist:', err);
          const message = this.translate.instant('viewProduct.wishlist.removeError');
          const action = this.translate.instant('viewProduct.errors.ok');
          this.snackBar.open(message, action, {duration: 3000});
        }
      });
    } else {
      // Produsul nu este în wishlist, îl adăugăm
      this.userService.addToWishlist(productId).subscribe({
        next: () => {
          this.isInWishlist.set(true);
          const message = this.translate.instant('viewProduct.wishlist.added');
          const action = this.translate.instant('viewProduct.errors.ok');
          this.snackBar.open(message, action, {duration: 3000});
        },
        error: (err) => {
          console.error('Error adding to wishlist:', err);
          const message = this.translate.instant('viewProduct.wishlist.addError');
          const action = this.translate.instant('viewProduct.errors.ok');
          this.snackBar.open(message, action, {duration: 3000});
        }
      });
    }
  }
}
