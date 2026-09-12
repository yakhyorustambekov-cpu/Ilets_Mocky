export function getBasePath(): string {
  let p = window.location.pathname;
  if (p.endsWith('.html') || p.endsWith('.php')) {
    p = p.substring(0, p.lastIndexOf('/'));
  }
  const knownRoutes = ['/login', '/signup', '/reset-password', '/student', '/admin'];
  for (const route of knownRoutes) {
    const idx = p.indexOf(route);
    if (idx !== -1) {
      p = p.substring(0, idx);
      break;
    }
  }
  return p.replace(/\/+$/, '');
}

export function getApiBase(): string {
  const base = getBasePath();
  return `${base}/api`;
}

export function getContentUrl(versionId?: string, entryFile?: string): string {
  if (!versionId) return '';
  const base = getBasePath();
  const file = entryFile || 'index.html';
  return `${base}/test-content.php?versionId=${encodeURIComponent(versionId)}&path=${encodeURIComponent(file)}`;
}

export function getToken(): string | null {
  return localStorage.getItem('ielts_auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('ielts_auth_token', token);
}

export function removeToken() {
  localStorage.removeItem('ielts_auth_token');
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const apiBase = getApiBase();
  let response: Response | null = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers,
  }).catch(() => null);

  // If request fails or returns 404 (due to disabled .htaccess or mod_rewrite on shared hosting),
  // fallback directly to api/index.php which is supported by ALL PHP hosts!
  if (!response || response.status === 404) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fallbackUrl = `${apiBase}/index.php?endpoint=${encodeURIComponent(cleanEndpoint)}`;
    const fallbackRes = await fetch(fallbackUrl, {
      ...options,
      headers,
    }).catch(() => null);

    if (fallbackRes && fallbackRes.status !== 404) {
      response = fallbackRes;
    }
  }

  if (!response) {
    throw new Error('Network error: Unable to reach server');
  }

  if (response.status === 401) {
    // If not on login or signup, remove token and dispatch event
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
      removeToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    signup: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => {
      removeToken();
      return request('/auth/logout', { method: 'POST' });
    },
    getMe: () => request('/auth/me'),
    resetPassword: (payload: { email: string; newPassword: string }) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  },

  tests: {
    getCounts: () => request('/tests/counts'),
    getPublished: (section?: string) =>
      request(`/tests${section ? `?section=${section}` : ''}`),
    getById: (id: string) => request(`/tests/${id}`),
  },

  attempts: {
    startSingle: (testId: string) =>
      request('/attempts/start', { method: 'POST', body: JSON.stringify({ testId }) }),
    getMyAttempts: (section?: string, status?: string) => {
      const params = new URLSearchParams();
      if (section) params.append('section', section);
      if (status) params.append('status', status);
      return request(`/attempts/my?${params.toString()}`);
    },
    getById: (id: string) => request(`/attempts/${id}`),
    complete: (id: string, payload: { rawScore?: number; maxScore?: number; bandScore?: number; resultData?: any; timeSpentSeconds?: number }) =>
      request(`/attempts/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) }),
    abandon: (id: string) =>
      request(`/attempts/${id}/abandon`, { method: 'POST' }),
  },

  mocks: {
    getCurrent: () => request('/mocks/current'),
    start: () => request('/mocks/start', { method: 'POST' }),
    getById: (id: string) => request(`/mocks/${id}`),
    nextSection: (id: string, payload?: { rawScore?: number; maxScore?: number; bandScore?: number; resultData?: any; timeSpentSeconds?: number }) =>
      request(`/mocks/${id}/next-section`, { method: 'POST', body: JSON.stringify(payload || {}) }),
    abandon: (id: string) =>
      request(`/mocks/${id}/abandon`, { method: 'POST' }),
    getMyHistory: () => request('/mocks/my/history'),
  },

  profile: {
    get: () => request('/profile'),
    update: (data: any) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
    updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
      request('/profile/password', { method: 'PUT', body: JSON.stringify(payload) }),
  },

  admin: {
    getDashboard: () => request('/admin/dashboard'),
    getTests: (filters: { section?: string; status?: string; search?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.section) params.append('section', filters.section);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      return request(`/admin/tests?${params.toString()}`);
    },
    createTest: (formData: FormData) =>
      request('/admin/tests', { method: 'POST', body: formData }),
    getTestById: (id: string) => request(`/admin/tests/${id}`),
    updateTest: (id: string, data: any) =>
      request(`/admin/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadVersion: (id: string, formData: FormData) =>
      request(`/admin/tests/${id}/version`, { method: 'POST', body: formData }),
    deleteTest: (id: string) =>
      request(`/admin/tests/${id}`, { method: 'DELETE' }),
    getStudents: () => request('/admin/students'),
    getStudentById: (id: string) => request(`/admin/students/${id}`),
    getAttempts: (filters: { section?: string; status?: string; studentId?: string; page?: number } = {}) => {
      const params = new URLSearchParams();
      if (filters.section) params.append('section', filters.section);
      if (filters.status) params.append('status', filters.status);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.page) params.append('page', filters.page.toString());
      return request(`/admin/attempts?${params.toString()}`);
    },
    getResults: () => request('/admin/results'),
    getSettings: () => request('/admin/settings'),
    updateSettings: (settings: Record<string, string>) =>
      request('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    getAdmins: () => request('/admin/admins'),
    createAdmin: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      request('/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
  },
};
