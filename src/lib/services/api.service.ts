import { browser } from '$app/environment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

type QueryParams = Record<string, string>;

interface FetchOptions extends Omit<RequestInit, 'body'> {
	params?: QueryParams;
	requiresAuth?: boolean;
	body?: BodyInit | object | null;
}

interface ApiResponse<T> {
	message?: string;
	data?: T;
	errors?: unknown;
}

function createHeaders(customHeaders?: HeadersInit, body?: BodyInit | object | null): Headers {
	const headers = new Headers(customHeaders);

	if (!(body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	headers.set('Accept', 'application/json');

	return headers;
}

function createBody(body?: BodyInit | object | null): BodyInit | undefined {
	if (!body) return undefined;

	if (
		body instanceof FormData ||
		body instanceof Blob ||
		body instanceof URLSearchParams ||
		typeof body === 'string'
	) {
		return body;
	}

	return JSON.stringify(body);
}

function createUrl(endpoint: string, params?: QueryParams): string {
	const url = new URL(`${API_BASE_URL}${endpoint}`);

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});
	}

	return url.toString();
}

function getAccessToken(): string | null {
	if (!browser) return null;

	return (
		localStorage.getItem('access_token') ||
		localStorage.getItem('token') ||
		localStorage.getItem('auth_token')
	);
}

export const apiService = {
	async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
		const {
			params,
			requiresAuth = true,
			headers: customHeaders,
			body,
			...customConfig
		} = options;

		const headers = createHeaders(customHeaders, body);

		if (requiresAuth) {
			const token = getAccessToken();

			if (token) {
				headers.set('Authorization', `Bearer ${token}`);
			} else if (browser) {
				console.warn(`[API Warning] No access token found for protected endpoint: ${endpoint}`);
			}
		}

		const config: RequestInit = {
			...customConfig,
			headers,
			credentials: 'include'
		};

		const requestBody = createBody(body);

		if (requestBody !== undefined) {
			config.body = requestBody;
		}

		const url = createUrl(endpoint, params);

		try {
			const response = await fetch(url, config);

			let json: ApiResponse<T> = {};

			const contentType = response.headers.get('content-type');

			if (contentType?.includes('application/json')) {
				json = (await response.json()) as ApiResponse<T>;
			}

			if (!response.ok) {
				throw new Error(json.message || `Request failed with status ${response.status}`);
			}

			return json.data as T;
		} catch (error) {
			console.error(`[API Error] ${endpoint}:`, error);
			throw error;
		}
	},

	get<T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) {
		return this.request<T>(endpoint, {
			...options,
			method: 'GET'
		});
	},

	post<T>(
		endpoint: string,
		body: BodyInit | object,
		options?: Omit<FetchOptions, 'method' | 'body'>
	) {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body
		});
	},

	put<T>(
		endpoint: string,
		body: BodyInit | object,
		options?: Omit<FetchOptions, 'method' | 'body'>
	) {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body
		});
	},

	patch<T>(
		endpoint: string,
		body: BodyInit | object,
		options?: Omit<FetchOptions, 'method' | 'body'>
	) {
		return this.request<T>(endpoint, {
			...options,
			method: 'PATCH',
			body
		});
	},

	delete<T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) {
		return this.request<T>(endpoint, {
			...options,
			method: 'DELETE'
		});
	}
};