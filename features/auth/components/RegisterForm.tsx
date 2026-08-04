"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { signup } from "@/features/auth/actions/auth";
import { FeePayment } from "@/features/auth/components/FeePayment";
import { SignupFormSchema, type FormState } from "@/lib/definitions";
import { doubleSha256Hex } from "@/lib/password";

type SignupValues = z.infer<typeof SignupFormSchema>;

export function RegisterForm({
  feeSol,
  collectionWallet,
}: {
  feeSol: number;
  collectionWallet: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      signature: collectionWallet ? "" : "dev",
    },
  });

  const signature = useWatch({ control: form.control, name: "signature" });

  async function onSubmit(values: SignupValues) {
    setPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("email", values.email);
    formData.set("password", await doubleSha256Hex(values.password));
    formData.set("signature", values.signature);

    const state: FormState = await signup(undefined, formData);
    setPending(false);

    if (state?.errors) {
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) {
          form.setError(key as keyof SignupValues, { message: messages[0] });
        }
      }
    }
    if (state?.message) {
      setServerError(state.message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-name">Name</FieldLabel>
              <Input
                {...field}
                id="register-name"
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">Email</FieldLabel>
              <Input
                {...field}
                id="register-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-password">Password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
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
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {collectionWallet ? (
        <FeePayment
          label="Registration fee"
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
        {pending ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
