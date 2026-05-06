import { api } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { TokenPair, UserProfile } from "@/features/auth/model/types";

export async function postPasswordToken(username: string, password: string): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>(API_ENDPOINTS.auth.token, { username, password });
  return data;
}

export async function postOidcExchange(idpAccessToken: string): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>(API_ENDPOINTS.auth.oidc, { token: idpAccessToken });
  return data;
}

export async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(API_ENDPOINTS.auth.user);
  return data;
}
