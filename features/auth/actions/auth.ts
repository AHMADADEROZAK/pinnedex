"use server";

import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { createSession, deleteSession } from "@/lib/session";
import { enforceRateLimit } from "@/features/security";
import {
  LoginServerSchema,
  SignupServerSchema,
  type FormState,
} from "@/lib/definitions";
import { User, type UserRole } from "@/features/auth/models/User";

const rateLimited = (): FormState => ({
  message: "Too many requests. Please wait a minute.",
});

function roleForEmail(email: string): UserRole {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? "admin" : "user";
}

export async function signup(state: FormState, formData: FormData) {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return rateLimited();

  const validatedFields = SignupServerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  await connectToDatabase();

  const existing = await User.findOne({ email }).exec();
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const role = roleForEmail(email);
  const user = new User({ name, email, passwordHash: password, role });
  await user.save();

  await createSession(user._id.toString(), role);
  redirect("/profile");
}

export async function login(state: FormState, formData: FormData) {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return rateLimited();

  const validatedFields = LoginServerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  await connectToDatabase();

  const user = await User.findOne({ email }).exec();
  if (!user) {
    return { errors: { email: ["No account found with this email."] } };
  }

  if (user.passwordHash !== password) {
    return { errors: { password: ["Incorrect password."] } };
  }

  await createSession(user._id.toString(), user.role);
  redirect("/profile");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
