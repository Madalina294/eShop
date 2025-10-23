import {Component, OnInit, signal} from '@angular/core';
import {ProductData} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user/user.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-view-product',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss'
})
export class ViewProductComponent implements OnInit{
  loading = signal(false);
  isInWishlist = signal(false);
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

  addToCart(productId: number){
    // TODO: implement the logic of adding a product to the Cart
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
