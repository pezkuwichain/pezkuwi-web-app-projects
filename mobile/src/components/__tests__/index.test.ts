import * as Components from '../index';

describe('Component exports', () => {
  it('should export all components', () => {
    expect(Components.Badge).toBeDefined();
    expect(Components.Button).toBeDefined();
    expect(Components.Card).toBeDefined();
    expect(Components.Input).toBeDefined();
    expect(Components.Skeleton).toBeDefined();
    expect(Components.TokenIcon).toBeDefined();
    expect(Components.ErrorBoundary).toBeDefined();
    expect(Components.BottomSheet).toBeDefined();
    expect(Components.AddressDisplay).toBeDefined();
    expect(Components.BalanceCard).toBeDefined();
    expect(Components.TokenSelector).toBeDefined();
  });
});
