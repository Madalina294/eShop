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

@Component({
  selector: 'app-view-product',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss'
})
export class ViewProductComponent implements OnInit{
  loading = signal(false);
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
              private route: ActivatedRoute) {
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
      this.snackBar.open("ID-ul produsului nu a fost găsit!", "Ok", {duration: 3000});
      this.router.navigate(['/user/all-products']);
      return;
    }
    
    this.userService.getProduct(productId).subscribe({
      next: value => {
        this.loading.set(false);
        this.product.set(value);
      },
      error: err => {
        this.loading.set(false);
        console.error('Error loading product:', err);
        this.snackBar.open("Ceva nu a mers bine la încărcarea produsului!", "Ok", {duration: 3000});
      }
    })
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
    // TODO: implement the logic of adding a product to the WishList
  }
}
