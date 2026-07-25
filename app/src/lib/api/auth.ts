import { apiRequest } from "@/lib/api/client";

export type UserRole = "citizen" | "merchant" | "lgu_admin";

export type User = {
  id: number;
  name: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string;
  role: UserRole;
  phone: string | null;
  barangay_id: number | null;
  location_id: number | null;
  needs_approval: boolean;
  is_approved: boolean;
  approved_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AuthResponse = {
  token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  user: User;
};

export type RegisterPayload = {
  name: string;
  username?: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  phone?: string;
  barangay_id?: number;
  location_id?: number;
};

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function login(identifier: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { identifier, password },
    auth: false,
  });
}

export async function me() {
  const res = await apiRequest<{ data: User }>("/auth/me");
  return res.data;
}

export function logout() {
  return apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
}

export async function updateProfile(body: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone?: string | null;
}) {
  const res = await apiRequest<{ data: User }>("/auth/profile", {
    method: "PUT",
    body,
  });
  return res.data;
}

export function updatePassword(body: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return apiRequest<{ message: string }>("/auth/password", {
    method: "PUT",
    body,
  });
}

export function deleteAccount() {
  return apiRequest<{ message: string }>("/auth/account", { method: "DELETE" });
}
