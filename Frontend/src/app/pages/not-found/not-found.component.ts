import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserStateService } from '../../services/user-state/user-state.service';

/** 404 page. The app previously had no wildcard route at all. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  private readonly userState = inject(UserStateService);

  /** Send signed-in shoppers to the catalog, everyone else to the login page. */
  protected readonly homeLink = this.userState.isCustomer()
    ? '/user/all-products'
    : this.userState.isAdmin()
      ? '/admin'
      : '/login';
}
