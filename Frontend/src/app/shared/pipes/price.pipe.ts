import { CurrencyPipe } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

/**
 * Money, with the currency never glued to the amount.
 *
 * Angular's `currency` pipe renders `RON0.00` in the en locale, because the
 * symbol for RON is the three-letter code and the locale pattern inserts no
 * separator before the digits. Every price in the app went through that pipe,
 * so the whole catalogue, cart, checkout and admin read `RON123.00`.
 *
 * Formatting stays exactly as before — the digit grouping, the two decimals and
 * the symbol all still come from `CurrencyPipe`. The only change is the space.
 *
 * Usage: `{{ amount | price }}` or `{{ amount | price: currencyCode }}`.
 */
@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  // `CurrencyPipe` is not injectable without being provided, so it is built
  // directly from the app locale.
  private readonly currency = new CurrencyPipe(inject(LOCALE_ID));

  transform(value: number | string | null | undefined, currencyCode = 'RON'): string {
    const formatted = this.currency.transform(value, currencyCode, 'symbol', '1.2-2');
    if (!formatted) return '';

    // Split a leading symbol off the first digit, keeping any minus sign with
    // the number. Locales that render the symbol as a suffix already include a
    // separator, so they need no handling here.
    return formatted.replace(/^(-?)(\D+?)(?=\d)/, (_, sign: string, symbol: string) =>
      `${sign}${symbol.trim()} `
    );
  }
}
