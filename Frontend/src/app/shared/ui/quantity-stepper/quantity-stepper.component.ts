import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A −/value/+ quantity control, clamped to `min`..`max`.
 *
 * Replaces the bare `<input type="number">` used on the product page, which
 * had tiny native spinners, no touch target, and let a user type a quantity
 * above the available stock before the click was rejected.
 */
@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quantity-stepper.component.html',
  styleUrl: './quantity-stepper.component.scss',
})
export class QuantityStepperComponent {
  readonly value = model.required<number>();
  readonly min = input<number>(1);
  readonly max = input<number>(99);
  readonly disabled = input<boolean>(false);
  readonly size = input<'md' | 'sm'>('md');
  /** Accessible name for the whole control, e.g. the product name. */
  readonly label = input<string>('');

  protected readonly canDecrease = computed(() => !this.disabled() && this.value() > this.min());
  protected readonly canIncrease = computed(() => !this.disabled() && this.value() < this.max());

  protected step(delta: number): void {
    this.commit(this.value() + delta);
  }

  protected onInput(raw: string): void {
    const parsed = Number.parseInt(raw, 10);
    this.commit(Number.isFinite(parsed) ? parsed : this.min());
  }

  /** Single clamp point, so the value can never leave min..max. */
  private commit(next: number): void {
    const clamped = Math.min(this.max(), Math.max(this.min(), next));
    if (clamped !== this.value()) this.value.set(clamped);
  }
}
