import { TRPCError } from "@trpc/server";
import { supabase } from "./supabase";
import { env } from "./env";

type ProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
};

export type AuthenticatedAppUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "admin";
  authType: "supabase";
};

function getBearerToken(headers: Headers) {
  const authHeader = headers.get("authorization") ?? headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim() || null;
}

function toAuthenticatedUser(profile: ProfileRow): AuthenticatedAppUser {
  return {
    id: profile.user_id,
    name: profile.full_name || profile.email || "User",
    email: profile.email || "",
    avatar: profile.avatar_url,
    role: profile.role,
    authType: "supabase",
  };
}

export async function ensureProfileForUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<AuthenticatedAppUser> {
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("user_id, email, full_name, avatar_url, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: existingError.message,
    });
  }

  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;
  const avatarUrl =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null;
  const normalizedEmail = user.email?.toLowerCase() ?? null;

  if (!existing) {
    const role =
      normalizedEmail && env.ownerEmail && normalizedEmail === env.ownerEmail
        ? "admin"
        : "user";

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        email: normalizedEmail,
        full_name: fullName,
        avatar_url: avatarUrl,
        role,
        last_sign_in_at: new Date().toISOString(),
      })
      .select("user_id, email, full_name, avatar_url, role")
      .single();

    if (insertError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: insertError.message,
      });
    }

    return toAuthenticatedUser(inserted as ProfileRow);
  }

  const updates: Record<string, string> = {
    last_sign_in_at: new Date().toISOString(),
  };

  if (normalizedEmail && normalizedEmail !== existing.email) {
    updates.email = normalizedEmail;
  }
  if (fullName && fullName !== existing.full_name) {
    updates.full_name = fullName;
  }
  if (avatarUrl && avatarUrl !== existing.avatar_url) {
    updates.avatar_url = avatarUrl;
  }

  if (Object.keys(updates).length > 1) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (updateError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: updateError.message,
      });
    }
  }

  return toAuthenticatedUser({
    ...(existing as ProfileRow),
    email: normalizedEmail ?? existing.email,
    full_name: fullName ?? existing.full_name,
    avatar_url: avatarUrl ?? existing.avatar_url,
  });
}

export async function authenticateRequest(
  headers: Headers,
): Promise<AuthenticatedAppUser | null> {
  const token = getBearerToken(headers);
  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return ensureProfileForUser(data.user);
}
