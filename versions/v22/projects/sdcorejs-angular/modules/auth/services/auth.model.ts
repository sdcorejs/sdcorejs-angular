export interface SdAuthInfo<T = unknown> {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  data?: T;
}
