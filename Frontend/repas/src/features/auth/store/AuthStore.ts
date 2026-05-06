import { makeAutoObservable, runInAction } from "mobx";
import { getCurrentUser, postOidcExchange, postPasswordToken } from "@/features/auth/api/authApi";
import type { TokenPair } from "@/features/auth/model/types";
import { getAxiosErrorMessage } from "@/api/client";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  persistUserSnapshot,
  registerSessionClear,
  setTokenPair,
} from "@/lib/auth";
import { type AuthUser, profileToUser } from "@/features/auth/model/types";

class AuthStore {
  user: AuthUser | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    registerSessionClear(() => {
      runInAction(() => {
        this.user = null;
        this.error = null;
      });
    });
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      try {
        this.user = JSON.parse(saved) as AuthUser;
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    void this.tryHydrateProfileFromTokens();
  }

  get isAuthenticated() {
    return !!this.user;
  }

  get greetingLine(): string {
    const u = this.user;
    if (!u) return "";
    const prenom = u.firstName?.trim();
    const nom = u.lastName?.trim();
    if (prenom && nom) return `Bonjour ${prenom} ${nom}`;
    if (prenom) return `Bonjour ${prenom}`;
    if (nom) return `Bonjour ${nom}`;
    return `Bonjour ${u.username}`;
  }

  private async tryHydrateProfileFromTokens() {
    if (this.user) return;
    if (!getRefreshToken() && !getAccessToken()) return;
    try {
      const profile = await getCurrentUser();
      runInAction(() => {
        this.user = profileToUser(profile);
        persistUserSnapshot(JSON.stringify(this.user));
      });
    } catch {
      /* session expirée ou réseau : pas d’action forcée */
    }
  }

  private async applyTokenPairThenLoadProfile(tokens: TokenPair) {
    setTokenPair(tokens.access, tokens.refresh);
    const profile = await getCurrentUser();
    runInAction(() => {
      this.user = profileToUser(profile);
      persistUserSnapshot(JSON.stringify(this.user));
    });
  }

  async login(username: string, password: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;
    try {
      const tokens = await postPasswordToken(username, password);
      await this.applyTokenPairThenLoadProfile(tokens);
      runInAction(() => {
        this.isLoading = false;
      });
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isLoading = false;
      });
      return false;
    }
  }

  async loginWithIdpToken(idpAccessToken: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;
    try {
      const tokens = await postOidcExchange(idpAccessToken);
      await this.applyTokenPairThenLoadProfile(tokens);
      runInAction(() => {
        this.isLoading = false;
      });
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isLoading = false;
      });
      return false;
    }
  }

  logout() {
    clearAuthSession();
  }

  clearError() {
    this.error = null;
  }

  setError(message: string | null) {
    this.error = message;
  }
}

export const authStore = new AuthStore();
