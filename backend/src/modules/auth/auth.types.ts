export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponseData {
  success: boolean;
  token: string;
  user: AuthUserResponse;
}
