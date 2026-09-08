const TIMEOUT_MS = 15_000;

export async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时，稍后再试');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
