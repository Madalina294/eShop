import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserStateService } from '../../../services/user-state/user-state.service';

/** The app had no footer at all; this one is the only global one. */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.scss',
})
export class AppFooterComponent {
  private readonly userState = inject(UserStateService);

  protected readonly year = new Date().getFullYear();
  protected readonly isCustomer = this.userState.isCustomer;
  protected readonly isSignedIn = computed(
    () => this.userState.isAdmin() || this.userState.isCustomer()
  );
}
