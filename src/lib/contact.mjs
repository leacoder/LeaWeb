/** Submit through the configured provider; never infer success from HTTP alone.
 * @param {string} endpoint
 * @param {Record<string, string>} values
 * @param {{ fetcher?: typeof fetch, signal?: AbortSignal }} options
 * @returns {Promise<'sent' | 'activation'>}
 */
export async function sendContact(endpoint, values, { fetcher = fetch, signal } = {}) {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(values),
    signal,
  });
  if (!response.ok) throw new Error('contact-http-error');
  const result = await response.json();
  if (result && /activat|confirm.{0,30}email|verify.{0,30}email/i.test(String(result.message ?? ''))) return 'activation';
  if (!result || (result.success !== true && result.success !== 'true')) throw new Error('contact-rejected');
  return 'sent';
}
