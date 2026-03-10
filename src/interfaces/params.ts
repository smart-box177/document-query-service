export interface IResponse {
  data?: any;
  status: number;
  message: string;
  success: boolean;
}

export interface TokenPayload {
  user_id: string;
  email: string;
}

export interface AccessTokenPayload {
  user_id: string;
  email: string;
  username: string;
  role?: string;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}