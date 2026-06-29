export interface SdAuthInfo<T = any> {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  data?: T;
}
