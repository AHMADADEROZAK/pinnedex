"use server";

import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { createSession, deleteSession } from "@/lib/session";
import { enforceRateLimit } from "@/features/security";
import { verifyLoginPayment, verifyRegistrationPayment } from "@/features/presale/server/verify";
import { presaleConfig } from "@/features/presale/config";
import {
  LoginServerSchema,
  SignupServerSchema,
  type FormState,
} from "@/lib/definitions";
import { User, type UserRole } from "@/features/auth/models/User";
import { LoginPayment } from "@/features/auth/models/LoginPayment";
import * as z from "zod";

const rateLimited = (): FormState => ({
  message: "Too many requests. Please wait a minute.",
});

const EmailCheckSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
});

export type EmailCheckResult =
  | { exists: true; admin: boolean }
  | { exists: false; error: string };

export type SignupEmailCheckResult =
  | { ok: true; admin: boolean }
  | { ok: false; error: string };

export async function checkEmail(
  state: EmailCheckResult | undefined,
  formData: FormData,
): Promise<EmailCheckResult> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) {
    return { exists: false, error: "Too many requests. Please wait a minute." };
  }

  const validated = EmailCheckSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validated.success) {
    return {
      exists: false,
      error: validated.error.flatten().fieldErrors.email?.[0] ?? "Invalid email.",
    };
  }

  await connectToDatabase();

  const user = await User.findOne({ email: validated.data.email }).exec();
  if (!user) {
    return { exists: false, error: "No account found with this email." };
  }

  return { exists: true, admin: roleForEmail(validated.data.email) === "admin" };
}

export async function checkSignupEmail(
  state: SignupEmailCheckResult | undefined,
  formData: FormData,
): Promise<SignupEmailCheckResult> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) {
    return { ok: false, error: "Too many requests. Please wait a minute." };
  }

  const validated = EmailCheckSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validated.success) {
    return {
      ok: false,
      error: validated.error.flatten().fieldErrors.email?.[0] ?? "Invalid email.",
    };
  }

  return { ok: true, admin: roleForEmail(validated.data.email) === "admin" };
}

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
    signature: formData.get("signature"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, signature } = validatedFields.data;

  await connectToDatabase();

  const isAdmin = roleForEmail(email) === "admin";

  const existing = await User.findOne({ email }).exec();
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const usedTx = signature
    ? await User.findOne({ registrationTx: signature }).exec()
    : null;
  if (usedTx) {
    return {
      errors: { signature: ["This transaction signature has already been used."] },
    };
  }

  if (!isAdmin) {
    if (!signature) {
      return { errors: { signature: ["Transaction signature is required."] } };
    }
    if (presaleConfig.collectionWallet) {
      const payment = await verifyRegistrationPayment(signature);
      if (!payment.ok) {
        return { errors: { signature: [payment.error] } };
      }
    }
  }

  const role = roleForEmail(email);
  const user = new User({
    name,
    email,
    passwordHash: password,
    role,
    registrationTx: signature || undefined,
  });
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
    signature: formData.get("signature"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, signature } = validatedFields.data;

  await connectToDatabase();

  const user = await User.findOne({ email }).exec();
  if (!user) {
    return { errors: { email: ["No account found with this email."] } };
  }

  if (user.passwordHash !== password) {
    return { errors: { password: ["Incorrect password."] } };
  }

  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    if (!signature) {
      return { errors: { signature: ["Transaction signature is required."] } };
    }

    const usedPayment = await LoginPayment.findOne({ txSignature: signature }).exec();
    if (usedPayment) {
      return {
        errors: { signature: ["This transaction signature has already been used."] },
      };
    }

    if (presaleConfig.collectionWallet) {
      const payment = await verifyLoginPayment(signature);
      if (!payment.ok) {
        return { errors: { signature: [payment.error] } };
      }
    }

    const loginPayment = new LoginPayment({
      txSignature: signature,
      userId: user._id,
    });
    await loginPayment.save();
  }

  await createSession(user._id.toString(), user.role);
  redirect("/profile");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
