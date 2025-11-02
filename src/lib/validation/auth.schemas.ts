import { z } from "zod";

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include letters and numbers.";

export const emailSchema = z
  .string()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .refine((val) => /[A-Za-z]/.test(val) && /\d/.test(val), PASSWORD_POLICY_MESSAGE);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


