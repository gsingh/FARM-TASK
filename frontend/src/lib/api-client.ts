const BASE_URL = "/api"

interface ApiError {
  code: string
  message: string
}

class ApiClientError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    if (!response.ok) {
      throw new ApiClientError("PARSE_ERROR", `Server returned ${response.status}`, response.status)
    }
    return undefined as T
  }
  if (!response.ok) {
    const error = (body as Record<string, unknown>)?.error as Record<string, unknown> | undefined
    if (error?.code && error?.message) {
      throw new ApiClientError(String(error.code), String(error.message), response.status)
    }
    throw new ApiClientError(
      "UNKNOWN_ERROR",
      error?.message as string || String(error) || "An error occurred",
      response.status
    )
  }
  return body as T
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return ""
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

export const apiClient = {
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`)
    return handleResponse<T>(response)
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
  },

  async delete(path: string): Promise<void> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
    })
    await handleResponse<void>(response)
  },
}

export { ApiClientError }
export type { ApiError }
