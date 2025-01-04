export interface VerificationRequestParams {
  identifier: string;
  url: string;
  expires: Date;
  provider: {
    from: string;
  };
  token: string;
  theme: {
    colorScheme?: string;
    brandColor?: string;
    logo?: string;
  };
  request: Request;
}

export interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: string
}