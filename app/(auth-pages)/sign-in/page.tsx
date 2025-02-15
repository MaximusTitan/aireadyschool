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
import newLogo from "@/public/newLogo.png";

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
    <div className="min-h-screen w-screen bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(255,182,193,0.3)_25%,rgba(255,255,255,1)_80%)] dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
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
            src={newLogo}
            alt="AI Ready School"
            width={200}
            height={200}
            className="mx-auto relative"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 mb-4 text-left">
          Sign in
        </h1>
        {/* <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-left">
          Don’t have an account?{" "}
          <Link href="/sign-up" className="text-rose-600 font-medium underline">
            Sign up
          </Link>
        </p> */}

        <div className="flex flex-col gap-6 mt-2">
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
                className="text-xs text-rose-500 underline"
              >
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              name="password"
              placeholder="Your password"
              required
              className="border-gray-300 dark:border-neutral-700 focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <SubmitButton
            pendingText="Signing In..."
            className="bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white py-3 text-lg font-medium rounded-md shadow-lg shadow-rose-500/50"
          >
            Sign in
          </SubmitButton>

          {message && <FormMessage message={message} />}

          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            By signing in, you agree to our{" "}
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
