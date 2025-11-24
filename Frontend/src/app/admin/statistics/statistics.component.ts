import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService, UserOrderCount, TopCustomer, AverageCart } from '../../services/admin/admin.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    BreadcrumbComponent
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit {
  // Signals pentru date
  ordersByUser = signal<UserOrderCount[]>([]);
  topCustomers = signal<TopCustomer[]>([]);
  averageCart = signal<AverageCart | null>(null);
  
  // Signals pentru loading states
  loadingOrdersByUser = signal<boolean>(false);
  loadingTopCustomers = signal<boolean>(false);
  loadingAverageCart = signal<boolean>(false);

  // Computed signal pentru a verifica dacă există date
  hasOrdersByUser = computed(() => this.ordersByUser().length > 0);
  hasTopCustomers = computed(() => this.topCustomers().length > 0);
  hasAverageCart = computed(() => this.averageCart() !== null);

  // Coloane pentru tabele
  displayedColumnsOrders: string[] = ['userName', 'userEmail', 'orderCount'];
  displayedColumnsTopCustomers: string[] = ['userName', 'userEmail', 'orderCount', 'totalSpent'];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAllStatistics();
  }

  loadAllStatistics() {
    this.loadOrdersByUser();
    this.loadTopCustomers();
    this.loadAverageCart();
  }

  loadOrdersByUser() {
    this.loadingOrdersByUser.set(true);
    this.adminService.getOrdersCountByUser().subscribe({
      next: (data) => {
        this.ordersByUser.set(data);
        this.loadingOrdersByUser.set(false);
      },
      error: (error) => {
        console.error('Error loading orders by user:', error);
        this.snackBar.open('Error loading orders statistics', 'Close', { duration: 3000 });
        this.loadingOrdersByUser.set(false);
      }
    });
  }

  loadTopCustomers() {
    this.loadingTopCustomers.set(true);
    this.adminService.getTopCustomers(10).subscribe({
      next: (data) => {
        this.topCustomers.set(data);
        this.loadingTopCustomers.set(false);
      },
      error: (error) => {
        console.error('Error loading top customers:', error);
        this.snackBar.open('Error loading top customers', 'Close', { duration: 3000 });
        this.loadingTopCustomers.set(false);
      }
    });
  }

  loadAverageCart() {
    this.loadingAverageCart.set(true);
    this.adminService.getAverageCartValue().subscribe({
      next: (data) => {
        this.averageCart.set(data);
        this.loadingAverageCart.set(false);
      },
      error: (error) => {
        console.error('Error loading average cart:', error);
        this.snackBar.open('Error loading average cart statistics', 'Close', { duration: 3000 });
        this.loadingAverageCart.set(false);
      }
    });
  }

  refreshStatistics() {
    this.loadAllStatistics();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(value);
  }
}

