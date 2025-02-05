import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";
import Image from "next/image";
import logo from "@/public/logo.webp";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="p-6 max-w-md bg-white shadow-lg rounded-lg border border-gray-100">
          <FormMessage message={searchParams} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(255,182,193,0.3)_25%,rgba(255,255,255,1)_80%)] dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
      <form className="w-full max-w-xl px-16 py-12 bg-white shadow-sm dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col">
        <div className="flex justify-center w-full">
          <Image
            src={logo}
            alt="AI Ready School"
            width={150}
            height={150}
            className="mx-auto relative"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 mb-4 text-left">
          Sign up
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-left">
          Already have an account?{" "}
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
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label
              htmlFor="password"
              className="text-gray-700 dark:text-gray-300"
            >
              Password
            </Label>
            <PasswordInput
              name="password"
              placeholder="Your password"
              minLength={6}
              required
              className="border-gray-300 dark:border-neutral-700 focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">
              Role
            </Label>
            <Select name="role" required>
              <SelectTrigger className="border-gray-300 dark:border-neutral-700 focus:border-rose-500 focus:ring-rose-500 p-2 rounded-md">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="School">School</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <SubmitButton
            formAction={signUpAction}
            pendingText="Signing up..."
            className="bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white py-3 text-lg font-medium rounded-md shadow-lg shadow-rose-500/50"
          >
            Sign up
          </SubmitButton>

          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            By signing up, you agree to our{" "}
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
