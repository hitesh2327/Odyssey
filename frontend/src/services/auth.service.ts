import { api } from './api';

export class AuthService {
  public async register(data: any) {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  public async login(data: any) {
    const response = await api.post('/auth/login', data);
    return response.data;
  }

  public async googleAuth(idToken: string) {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  }

  public async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  }

  public async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }
}

export const authService = new AuthService();
