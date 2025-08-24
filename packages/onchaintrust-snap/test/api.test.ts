import { requestUiDefinition, type ApiResult } from '../src/api';
import type { UiPayload } from '../src/types/ui-schema';

describe('requestUiDefinition', () => {
  const ORIGINAL_FETCH = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = ORIGINAL_FETCH;
  });

  const mockFetchOk = (payload: UiPayload) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
  };

  const mockFetchHttp = (status = 500) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
    });
  };

  const mockFetchReject = (error: unknown) => {
    (global.fetch as jest.Mock).mockRejectedValue(error);
  };

  it('builds correct URL and returns ok=true with valid payload', async () => {
    const payload: UiPayload = {
      ui: [
        { type: 'heading', props: { children: 'Hello' } },
        {
          type: 'row',
          props: { label: 'Amount' },
          children: [{ type: 'value', props: { value: '0.05 ETH', extra: '$200' } }],
        },
      ]
    };
    mockFetchOk(payload);

    const address = '0xabc';
    const origin = 'https://example.com';
    const chainId = 'eip155:1';

    const result: ApiResult = await requestUiDefinition(address, origin, chainId);

    expect(result.ok).toBe(true);
    expect((result as any).data).toEqual(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledArg = (global.fetch as jest.Mock).mock.calls[0][0];

    const calledUrl = new URL(String(calledArg));
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      'https://app.onchaintrust.org/api/getAddressInfo',
    );
    expect(calledUrl.searchParams.get('address')).toBe(address);
    expect(calledUrl.searchParams.get('origin')).toBe(origin);
    expect(calledUrl.searchParams.get('chain_id')).toBe(chainId);
    expect(calledUrl.searchParams.get('client')).toBe('metamask');
  });

  it('returns ok=false on non-2xx HTTP', async () => {
    mockFetchHttp(502);

    const res = await requestUiDefinition('0xabc', 'https://ex', 'eip155:1');
    expect(res.ok).toBe(false);
    expect((res as any).error).toBe('HTTP 502');
  });

  it('returns ok=false on invalid payload structure', async () => {
    // ui[] element without type -> invalid
    const invalid: any = {
      ui: [{ props: { children: 'oops' } }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => invalid,
    });

    const res = await requestUiDefinition('0xabc', 'https://ex', 'eip155:1');
    expect(res.ok).toBe(false);
    expect((res as any).error).toBe('Invalid payload');
  });

  it('returns ok=false on invalid children array', async () => {
    // children contains object without type -> invalid
    const invalid: any = {
      ui: [
        { type: 'text', props: { children: 'hi' }, children: ['inline', { nope: true }] },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => invalid,
    });

    const res = await requestUiDefinition('0xabc', 'https://ex', 'eip155:1');
    expect(res.ok).toBe(false);
    expect((res as any).error).toBe('Invalid payload');
  });

  it('returns ok=false on network error', async () => {
    mockFetchReject(new Error('boom'));

    const res = await requestUiDefinition('0xabc', 'https://ex', 'eip155:1');
    expect(res.ok).toBe(false);
    expect((res as any).error).toBe('boom');
  });
});
