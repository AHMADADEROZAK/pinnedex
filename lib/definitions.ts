import * as z from "zod";

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters long." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
    .regex(/[0-9]/, { error: "Contain at least one number." })
    .trim(),
  signature: z
    .string()
    .min(1, { error: "Transaction signature is required." })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
  signature: z
    .string()
    .min(1, { error: "Transaction signature is required." })
    .trim(),
});

const passwordHashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, { error: "Password must be double-hashed (sha256)." });

export const SignupServerSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters long." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: passwordHashSchema,
  signature: z.string().trim().optional(),
});

export const LoginServerSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: passwordHashSchema,
  signature: z.string().trim().optional(),
});

export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;
