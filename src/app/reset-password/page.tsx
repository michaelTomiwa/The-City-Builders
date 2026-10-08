import type { Metadata } from "next";
import { Stars } from "@/components/site/stars";
import { ResetPasswordForm } from "@/components/members/reset-password-form";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <div className="on-night sky relative min-h-[70vh] overflow-hidden text-starlight">
      <Stars />
      <div className="relative mx-auto max-w-md px-6 py-24">
        <h1 className="font-display text-4xl">Set a new password</h1>
        <p className="mt-2 text-starlight-dim">Choose a password you&rsquo;ll remember. At least 6 characters.</p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
