import type { UiPayload } from './types/ui-schema';

export type ApiResult =
  | { ok: true; data: UiPayload }
  | { ok: false; error: string };

const BASE_URL = 'https://app.onchaintrust.org/api/getAddressInfo';

/**
 * Build the request URL for onchaintrust.org API.
 *
 * @param params Input params.
 * @param params.address Address (0x… or CAIP-10).
 * @param params.origin Request origin (site/client origin).
 * @param params.chainId Chain identifier (CAIP-2).
 * @returns URL instance with query params set.
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
 * Narrowing predicate for the API payload.
 *
 * @param value Any value to validate.
 * @returns true if value matches UiPayload shape; false otherwise.
 */
function isUiPayload(value: unknown): value is UiPayload {
  const payload = value as any;
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.ui)) {
    return false;
  }

  const isElement = (node: any) =>
    node &&
    typeof node === 'object' &&
    typeof node.type === 'string' &&
    (node.children === null ||
      node.children === undefined ||
      (Array.isArray(node.children) &&
        node.children.every(
          (child: any) =>
            typeof child === 'string' ||
            (child &&
              typeof child === 'object' &&
              typeof child.type === 'string'),
        )));

  if (!payload.ui.every(isElement)) {
    return false;
  }

  if (
    payload.severity !== null &&
    payload.severity !== undefined &&
    typeof payload.severity !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Fetch UI definition and validate it to a safe type.
 *
 * @param address Address to query.
 * @param origin Caller origin.
 * @param chainId Chain identifier (CAIP-2).
 * @returns \{ ok: true, data: json } on success; { ok: false, error } on failure.
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
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : 'Network error';
    return { ok: false, error: message };
  }
}
