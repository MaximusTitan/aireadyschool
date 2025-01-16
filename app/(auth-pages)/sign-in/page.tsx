"use client"; // Ensure it's a Client Component

import { useEffect, useState } from "react";
import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput"; // Added import
import Image from "next/image"; // Added import

interface LoginProps {
  searchParams: Promise<Message>;
}

export default function Login({ searchParams }: LoginProps) {
  const [message, setMessage] = useState<Message | null>(null);

  // Use useEffect to resolve the searchParams Promise
  useEffect(() => {
    searchParams.then(setMessage).catch(
      (err) => setMessage({ error: "Failed to load message" }) // Corrected structure
    );
  }, [searchParams]);

  return (
    <div
      className="min-h-screen w-screen bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(250,220,255,0.3) 35%, rgba(255,255,255,0.3) 100%)",
      }}
    >
      <form
        className="w-full max-w-xl px-16 py-12 bg-white shadow-sm dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await signInAction(formData);
        }}
      >
        <div className="flex justify-center w-full">
          <Image
            src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/images/ai-ready-school%20(1).png"
            alt="AI Ready School Logo"
            width={150}
            height={150}
            className="mb-4"
          />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4 text-left">
          Sign in
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-left">
          Don’t have an account?{" "}
          <Link href="/sign-up" className="text-pink-500 font-medium underline">
            Sign up
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
              className="border-gray-300 dark:border-neutral-700 focus:border-pink-500 focus:ring-pink-500"
              aria-label="Email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="password"
                className="text-gray-700 dark:text-gray-300"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-pink-500 underline"
              >
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              name="password"
              placeholder="Your password"
              required
              className="border-gray-300 dark:border-neutral-700 focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <SubmitButton
            pendingText="Signing In..."
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-3 text-lg font-medium rounded-md shadow-lg shadow-pink-500/50"
          >
            Sign in
          </SubmitButton>

          {message && <FormMessage message={message} />}

          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            By signing in, you agree to our{" "}
            <Link href="/privacy-policy" className="text-pink-500 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
