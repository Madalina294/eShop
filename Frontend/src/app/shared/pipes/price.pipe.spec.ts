import { TestBed } from '@angular/core/testing';
import { PricePipe } from './price.pipe';

describe('PricePipe', () => {
  let pipe: PricePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PricePipe] });
    pipe = TestBed.inject(PricePipe);
  });

  it('separates the currency from the amount', () => {
    // The whole point: Angular's currency pipe renders this as "RON0.00".
    expect(pipe.transform(0)).toBe('RON 0.00');
    expect(pipe.transform(1234.5)).toBe('RON 1,234.50');
  });

  it('keeps the minus sign attached to the number', () => {
    expect(pipe.transform(-12)).toBe('-RON 12.00');
  });

  it('accepts another currency code', () => {
    expect(pipe.transform(10, 'EUR')).toBe('€ 10.00');
  });

  it('renders nothing for an absent amount', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
