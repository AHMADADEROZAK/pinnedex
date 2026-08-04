"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { login, checkEmail, type EmailCheckResult } from "@/features/auth/actions/auth";
import { FeePayment } from "@/features/auth/components/FeePayment";
import { LoginFormSchema, type FormState } from "@/lib/definitions";
import { doubleSha256Hex } from "@/lib/password";

type LoginValues = z.infer<typeof LoginFormSchema>;

export function LoginForm({
  feeSol,
  collectionWallet,
}: {
  feeSol: number;
  collectionWallet: string;
}) {
  const [step, setStep] = useState<"email" | "credentials">("email");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      signature: collectionWallet ? "" : "dev",
    },
  });

  const signature = useWatch({ control: form.control, name: "signature" });

  async function handleCheckEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setServerError(null);

    const email = form.getValues("email");
    const fd = new FormData();
    fd.set("email", email);

    const result: EmailCheckResult = await checkEmail(undefined, fd);
    setPending(false);

    if (result.exists) {
      setConfirmedEmail(email);
      setStep("credentials");
    } else {
      form.setError("email", { message: result.error });
    }
  }

  async function onSubmit(values: LoginValues) {
    setPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", await doubleSha256Hex(values.password));
    formData.set("signature", values.signature);

    const state: FormState = await login(undefined, formData);
    setPending(false);

    if (state?.errors) {
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) {
          form.setError(key as keyof LoginValues, { message: messages[0] });
        }
      }
    }
    if (state?.message) {
      setServerError(state.message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {step === "email" ? (
        <form onSubmit={handleCheckEmail} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Checking..." : "Continue"}
          </Button>
        </form>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setStep("email");
                setConfirmedEmail("");
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Logging in as</span>
              <span className="text-sm font-medium">{confirmedEmail}</span>
            </div>
          </div>

          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size={"icon-sm"}
                        className="rounded-full"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          {collectionWallet ? (
            <FeePayment
              label="Login fee"
              feeSol={feeSol}
              collectionWallet={collectionWallet}
              onSignature={(sig) =>
                form.setValue("signature", sig, { shouldValidate: true })
              }
            />
          ) : null}

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={pending || !signature} className="w-full">
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Signing in..." : "Login"}
          </Button>
        </form>
      )}
    </div>
  );
}
