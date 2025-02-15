"use client";

import { useEffect, useState } from "react";
import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import newLogo from "@/public/newLogo.png";

interface ForgotPasswordProps {
  searchParams: Promise<Message>;
}

export default function ForgotPassword({ searchParams }: ForgotPasswordProps) {
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    searchParams
      .then(setMessage)
      .catch((err) => setMessage({ error: "Failed to load message" }));
  }, [searchParams]);

  return (
    <div className="min-h-screen w-screen bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(255,182,193,0.3)_25%,rgba(255,255,255,1)_80%)] dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
      <form
        className="w-full max-w-xl px-16 py-12 bg-white shadow-sm dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await forgotPasswordAction(formData);
        }}
      >
        <div className="flex justify-center w-full mb-4">
          <Image
            src={newLogo}
            alt="AI Ready School"
            width={200}
            height={200}
            className="mx-auto relative"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 text-left">
          Reset Password
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-left">
          Remember your password?{" "}
          <Link href="/sign-in" className="text-rose-600 font-medium underline">
            Sign in
          </Link>
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="border-gray-300 dark:border-neutral-700 focus:border-rose-500 focus:ring-rose-500"
              aria-label="Email"
            />
          </div>

          <SubmitButton
            pendingText="Sending..."
            className="bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white py-3 text-lg font-medium rounded-md shadow-lg shadow-rose-500/50"
          >
            Reset Password
          </SubmitButton>

          {message && <FormMessage message={message} />}

          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            By continuing, you agree to our{" "}
            <Link href="/privacy-policy" className="text-rose-500 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
