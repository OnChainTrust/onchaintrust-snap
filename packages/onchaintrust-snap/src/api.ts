import type { UiPayload } from './types/ui-schema';

export type ApiResult =
  | { ok: true; data: UiPayload }
  | { ok: false; error: string };

const BASE_URL = 'https://app.onchaintrust.org/api/getAddressInfo';

/**
 *
 * @param params
 * @param params.address
 * @param params.origin
 * @param params.chainId
 */
function buildUrl(params: {
  address: string;
  origin: string;
  chainId: string;
}): URL {
  const { address, origin, chainId } = params;
  const url = new URL(BASE_URL);
  url.searchParams.set('address', address ?? '');
  url.searchParams.set('origin', origin ?? '');
  url.searchParams.set('chain_id', chainId ?? '');
  url.searchParams.set('client', 'metamask');
  return url;
}

/**
 *
 * @param value
 */
function isUiPayload(value: unknown): value is UiPayload {
  const v = value as any;
  if (!v || typeof v !== 'object' || !Array.isArray(v.ui)) {
    return false;
  }

  const isElement = (node: any) =>
    node &&
    typeof node === 'object' &&
    typeof node.type === 'string' &&
    (node.children == null ||
      (Array.isArray(node.children) &&
        node.children.every(
          (c: any) =>
            typeof c === 'string' ||
            (c && typeof c === 'object' && typeof c.type === 'string'),
        )));

  if (!v.ui.every(isElement)) {
    return false;
  }

  if (v.severity != null && typeof v.severity !== 'string') {
    return false;
  }

  return true;
}

/**
 *
 * @param address
 * @param origin
 * @param chainId
 */
export async function requestUiDefinition(
  address: string,
  origin: string,
  chainId: string,
): Promise<ApiResult> {
  try {
    const url = buildUrl({ address, origin, chainId });
    const response = await fetch(url);

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const json = await response.json();
    if (!isUiPayload(json)) {
      return { ok: false, error: 'Invalid payload' };
    }

    return { ok: true, data: json };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message };
  }
}
