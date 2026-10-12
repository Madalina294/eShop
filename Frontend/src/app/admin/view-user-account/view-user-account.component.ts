import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { UserData } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { avatarUrl } from '../../core/http/image-url';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

/** Read-only view of a single user account, opened from the user listing. */
@Component({
  selector: 'app-view-user-account',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-user-account.component.html',
  styleUrl: './view-user-account.component.scss',
})
export class ViewUserAccountComponent {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);

  private readonly userId = Number(this.route.snapshot.queryParams['userId']);

  protected readonly state = signal<ViewState>('loading');
  protected readonly user = signal<UserData | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!this.userId) {
      this.state.set('error');
      return;
    }

    this.state.set('loading');

    this.adminService.getUserById(this.userId).subscribe({
      next: user => {
        this.user.set(user);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected avatarFor(user: UserData): string {
    // Was hardcoded to `http://localhost:8080` + the raw path.
    return avatarUrl(user.imageUrl);
  }
}
