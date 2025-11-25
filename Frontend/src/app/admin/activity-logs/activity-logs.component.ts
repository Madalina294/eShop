import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin/admin.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatOptionModule } from '@angular/material/core';

export interface ActivityLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  actionType: string;
  actionDescription: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  metadata: string | null;
  createdAt: string;
}

export interface ActivityLogPaginatedResponse {
  content: ActivityLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    FormsModule,
    TranslateModule,
    BreadcrumbComponent,
    MatOptionModule
  ],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss'
})
export class ActivityLogsComponent implements OnInit {
  // Signals pentru date
  activityLogs = signal<ActivityLog[]>([]);
  loading = signal<boolean>(false);
  
  // Signals pentru paginare
  totalElements = signal<number>(0);
  pageSize = signal<number>(20);
  currentPage = signal<number>(0);
  
  // Valori pentru filtre (nu signals pentru ngModel compatibility)
  selectedUserIdValue: number | null = null;
  selectedActionTypeValue: string = '';
  selectedStatusValue: string = '';
  startDateValue: Date | null = null;
  endDateValue: Date | null = null;
  sortBy = signal<string>('createdAt');
  sortDir = signal<string>('desc');
  
  // Date pentru filtre
  users = signal<any[]>([]);
  actionTypes = signal<string[]>([]);
  statuses = signal<string[]>(['SUCCESS', 'ERROR', 'WARNING']);
  
  // Coloane pentru tabel
  displayedColumns: string[] = ['timestamp', 'user', 'actionType', 'actionDescription', 'status', 'ipAddress'];

  Math = Math; // Pentru a putea folosi Math în template

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.initializeActionTypes();
    this.loadActivityLogs();
  }

  initializeActionTypes() {
    this.actionTypes.set([
      'LOGIN',
      'LOGOUT',
      'REGISTER',
      'UPDATE_PROFILE',
      'CHANGE_PASSWORD',
      'ADD_TO_CART',
      'REMOVE_FROM_CART',
      'UPDATE_CART_QUANTITY',
      'ADD_TO_WISHLIST',
      'REMOVE_FROM_WISHLIST',
      'VIEW_PRODUCT',
      'CREATE_ORDER',
      'CANCEL_ORDER',
      'VIEW_ORDER',
      'CHANGE_THEME',
      'CHANGE_LANGUAGE',
      'DELETE_ACCOUNT',
      'SEARCH_PRODUCTS',
      'VIEW_CART',
      'VIEW_WISHLIST',
      'CHECKOUT_STARTED',
      'CHECKOUT_COMPLETED'
    ]);
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadActivityLogs() {
    this.loading.set(true);
    
    const startDateStr = this.startDateValue 
      ? this.formatDateForBackend(this.startDateValue) 
      : null;
    const endDateStr = this.endDateValue 
      ? this.formatDateForBackend(this.endDateValue) 
      : null;
    
    const params = new URLSearchParams({
      page: this.currentPage().toString(),
      size: this.pageSize().toString(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir()
    });
    
    if (this.selectedUserIdValue !== null) {
      params.append('userId', this.selectedUserIdValue.toString());
    }
    if (this.selectedActionTypeValue !== '') {
      params.append('actionType', this.selectedActionTypeValue);
    }
    if (this.selectedStatusValue !== '') {
      params.append('status', this.selectedStatusValue);
    }
    if (startDateStr) {
      params.append('startDate', startDateStr);
    }
    if (endDateStr) {
      params.append('endDate', endDateStr);
    }
    
    this.adminService.getActivityLogs(params.toString()).subscribe({
      next: (response: ActivityLogPaginatedResponse) => {
        this.activityLogs.set(response.content || []);
        this.totalElements.set(response.totalElements || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading activity logs:', error);
        this.snackBar.open('Error loading activity logs', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadActivityLogs();
  }

  onFilterChange() {
    this.currentPage.set(0); // Reset to first page when filtering
    this.loadActivityLogs();
  }

  clearFilters() {
    this.selectedUserIdValue = null;
    this.selectedActionTypeValue = '';
    this.selectedStatusValue = '';
    this.startDateValue = null;
    this.endDateValue = null;
    this.onFilterChange();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('ro-RO');
  }

  formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'status-success';
      case 'ERROR':
        return 'status-error';
      case 'WARNING':
        return 'status-warning';
      default:
        return '';
    }
  }
}

