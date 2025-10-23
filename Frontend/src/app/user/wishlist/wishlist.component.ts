import {Component, OnInit, signal} from '@angular/core';
import {UserService} from '../../services/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-wishlist',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent implements OnInit{
  wishlistItems = signal<any[]>([]);
  loading = signal(false);

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist(){
    this.loading.set(true);
    this.userService.getUserWishlist().subscribe({
      next: value => {
        this.loading.set(false);
        this.wishlistItems.set(value);
      },
      error: err => {
        this.loading.set(false);
        console.error('Error loading wishlist:', err);
        const message = this.translate.instant('wishlist.errors.loadingFailed');
        const action = this.translate.instant('wishlist.errors.ok');
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

  removeFromWishlist(productId: number, event: Event) {
    event.stopPropagation(); // Previne navigarea către produs când apesi pe buton
    
    this.userService.removeFromWishlist(productId).subscribe({
      next: () => {
        // Actualizează lista locală prin eliminarea produsului
        this.wishlistItems.update(items => 
          items.filter(item => item.productId !== productId)
        );
        const message = this.translate.instant('wishlist.removed');
        const action = this.translate.instant('wishlist.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      },
      error: (err) => {
        console.error('Error removing from wishlist:', err);
        const message = this.translate.instant('wishlist.removeError');
        const action = this.translate.instant('wishlist.errors.ok');
        this.snackBar.open(message, action, {duration: 3000});
      }
    });
  }

  goToViewProduct(productId: number) {
    this.router.navigate(['/user/view-product'], {
      queryParams: { id: productId }
    });
  }

  goToAllProducts() {
    this.router.navigate(['/user/all-products']);
  }

  addToCart(productId: number, event: Event) {
    event.stopPropagation(); // Previne navigarea către produs când apesi pe buton
    
    // TODO: implement the logic of adding a product to the Cart
    const message = this.translate.instant('wishlist.addToCartSuccess');
    const action = this.translate.instant('wishlist.errors.ok');
    this.snackBar.open(message, action, {duration: 3000});
  }
}
