export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
  imageUrl?: string | null;
  mfaEnabled?: boolean;
  preferredTheme?: 'light' | 'dark';
  preferredLanguage?: 'ro' | 'en';
  googleId?: string | null;
}
