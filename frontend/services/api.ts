/**
 * Cliente HTTP para la API Laravel: JSON, cabeceras de autenticacion y
 * errores con el mensaje que devuelve el backend.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

export const apiRequest = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (e) {
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errors = data?.errors || {};
    const firstError = Object.values(errors).flat()[0] as string | undefined;
    throw new ApiError(firstError || data?.message || `Error del servidor (${response.status}).`, response.status, errors);
  }

  return data as T;
};
