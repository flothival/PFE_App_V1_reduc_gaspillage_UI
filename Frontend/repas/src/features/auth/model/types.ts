export type TokenPair = {
  access: string;
  refresh: string;
};

export type UserProfile = {
  id: number | string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export type AuthUser = {
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  id?: number | string;
};

export function profileToUser(p: UserProfile): AuthUser {
  return {
    id: p.id,
    username: p.username,
    email: typeof p.email === "string" ? p.email : undefined,
    firstName: p.first_name?.trim() || undefined,
    lastName: p.last_name?.trim() || undefined,
  };
}
