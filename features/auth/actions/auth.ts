"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { createSession, deleteSession } from "@/lib/session";
import { enforceRateLimit } from "@/features/security";
import { LoginFormSchema, SignupFormSchema, type FormState } from "@/lib/definitions";
import { User } from "@/features/auth/models/User";

const rateLimited = (): FormState => ({
  message: "Too many requests. Please wait a minute.",
});

export async function signup(state: FormState, formData: FormData) {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return rateLimited();

  const validatedFields = SignupFormSchema.safeParse({
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

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash });
  await user.save();

  await createSession(user._id.toString());
  redirect("/profile");
}

export async function login(state: FormState, formData: FormData) {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return rateLimited();

  const validatedFields = LoginFormSchema.safeParse({
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

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { errors: { password: ["Incorrect password."] } };
  }

  await createSession(user._id.toString());
  redirect("/profile");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
