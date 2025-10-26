import {Component, OnInit, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CheckoutService } from '../../services/checkout/checkout.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-order-confirmation',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    MatProgressSpinner
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private checkoutService: CheckoutService
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder();
    }
  }

  private loadOrder() {
    this.loading.set(true);
    this.checkoutService.getOrder(+this.orderId!)
      .subscribe({
        next: (order) => {
          this.loading.set(false);
          this.order = order;
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error loading order:', error);
        }
      });
  }

  continueShopping() {
    this.router.navigate(['/user/all-products']);
  }

  viewOrder() {
    // Pentru moment, redirecționează la all-products
    // În viitor, poți adăuga o pagină dedicată pentru vizualizarea comenzilor
    this.router.navigate(['/user/all-products']);
  }
}
