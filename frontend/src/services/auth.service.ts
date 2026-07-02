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

  public async verifyEmail(userId: string, otp: string) {
    const response = await api.post('/auth/verify-email', { userId, otp });
    return response.data;
  }

  public async resendOtp(userId: string) {
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  }

  public async changeEmailRequest(newEmail: string) {
    const response = await api.post('/auth/change-email/request', { newEmail });
    return response.data;
  }

  public async changeEmailVerify(otp: string) {
    const response = await api.post('/auth/change-email/verify', { otp });
    return response.data;
  }

  public async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  public async resetPassword(data: any) {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }

  public async resetPasswordResend(email: string) {
    const response = await api.post('/auth/reset-password/resend', { email });
    return response.data;
  }
}

export const authService = new AuthService();
