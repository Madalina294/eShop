export interface RegisterRequest{
  firstname?: string;
  lastname?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  role?: string;
  image?: string;
  mfaEnabled?: boolean;
}
