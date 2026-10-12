import { environment } from '../../../environments/environments';

/** API origin without the trailing `/api` segment — serves uploads and OAuth. */
export const API_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

const PLACEHOLDER_PRODUCT = 'assets/images/product-placeholder.svg';
const PLACEHOLDER_AVATAR = 'assets/images/avatar-placeholder.svg';

/**
 * Resolves a backend image path into a usable URL.
 *
 * Replaces the four copies of `getFullImageUrl()` / `getProductImage()` that
 * each hardcoded `http://localhost:8080`, which broke every non-local build.
 */
export function resolveImageUrl(path: string | null | undefined, fallback = ''): string {
  if (!path) return fallback;

  // Already absolute (external URL, Google avatar) or an inline data URI.
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}

/** Product image with the shared product placeholder as fallback. */
export function productImageUrl(image: string | null | undefined): string {
  return resolveImageUrl(image, PLACEHOLDER_PRODUCT);
}

/** User avatar with the shared avatar placeholder as fallback. */
export function avatarUrl(image: string | null | undefined): string {
  return resolveImageUrl(image, PLACEHOLDER_AVATAR);
}
