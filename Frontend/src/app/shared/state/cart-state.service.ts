import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { UserStateService } from '../../services/user-state/user-state.service';
import { environment } from '../../../environments/environments';

/** These are background reads — a failure must not pop a toast over the page. */
const SILENT = { headers: new HttpHeaders({ 'X-Skip-Error-Toast': '1' }) };

interface CountableItem {
  quantity?: number;
}

/**
 * Cart and wishlist counts, shared between the header badges and the cart /
 * wishlist pages.
 *
 * The header had no badges at all before, so a shopper could add items and get
 * no acknowledgement anywhere in the chrome. Pages call `refresh()` or the
 * optimistic helpers after mutating, and every consumer updates at once.
 */
@Injectable({ providedIn: 'root' })
export class CartStateService {
  private readonly http = inject(HttpClient);
  private readonly userState = inject(UserStateService);
  private readonly baseUrl = `${environment.apiUrl}/user`;

  private readonly cartCountSignal = signal(0);
  private readonly wishlistCountSignal = signal(0);

  readonly cartCount = this.cartCountSignal.asReadonly();
  readonly wishlistCount = this.wishlistCountSignal.asReadonly();

  /** `matBadge` hides itself on an empty string, so map 0 to ''. */
  readonly cartBadge = computed(() => (this.cartCount() > 0 ? String(this.cartCount()) : ''));
  readonly wishlistBadge = computed(() =>
    this.wishlistCount() > 0 ? String(this.wishlistCount()) : ''
  );

  constructor() {
    // Load on sign-in, clear on sign-out — otherwise the badges would keep the
    // previous user's numbers after a logout.
    effect(() => {
      if (this.userState.isCustomer()) {
        this.refresh();
      } else {
        this.cartCountSignal.set(0);
        this.wishlistCountSignal.set(0);
      }
    });
  }

  refresh(): void {
    this.refreshCart();
    this.refreshWishlist();
  }

  refreshCart(): void {
    this.http.get<CountableItem[]>(`${this.baseUrl}/cart`, SILENT).subscribe({
      next: items => this.cartCountSignal.set(this.countUnits(items)),
      error: () => this.cartCountSignal.set(0),
    });
  }

  refreshWishlist(): void {
    this.http.get<unknown[]>(`${this.baseUrl}/wishlist`, SILENT).subscribe({
      next: items => this.wishlistCountSignal.set(items?.length ?? 0),
      error: () => this.wishlistCountSignal.set(0),
    });
  }

  /** Bump the badge straight away, then reconcile with the server. */
  optimisticCartAdd(quantity = 1): void {
    this.cartCountSignal.update(count => count + quantity);
    this.refreshCart();
  }

  optimisticWishlistAdd(): void {
    this.wishlistCountSignal.update(count => count + 1);
    this.refreshWishlist();
  }

  optimisticWishlistRemove(): void {
    this.wishlistCountSignal.update(count => Math.max(0, count - 1));
    this.refreshWishlist();
  }

  /** The cart endpoint returns line items; the badge shows total units. */
  private countUnits(items: CountableItem[] | null | undefined): number {
    if (!items?.length) return 0;
    return items.reduce((total, item) => total + (item.quantity ?? 1), 0);
  }
}
