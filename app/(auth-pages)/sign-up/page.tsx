import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput"; // Added import
import Image from "next/image"; // Added import
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select"; // Added imports

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
    <div
      className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center w-screen" // Added w-screen
      style={{
        background:
          "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(250,220,255,0.3) 35%, rgba(255,255,255,0.3) 100%)",
      }}
    >
      <form className="w-full max-w-xl px-16 py-12 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-lg rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col">
        <div className="flex justify-center w-full">
          <Image
            src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/images/ai-ready-school%20(1).png" // Provide the correct logo path
            alt="AI Ready School Logo"
            width={150}
            height={150}
            className="mb-4"
          />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4 text-left">
          Sign up
        </h1>
        <p className="text-sm text-left text-gray-600 mb-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-pink-500 font-medium underline">
            Sign in
          </Link>
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="border-gray-300 focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="password" className="text-gray-700">
              Password
            </Label>
            <PasswordInput
              name="password"
              placeholder="Your password"
              minLength={6}
              required
              className="border-gray-300 focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="role" className="text-gray-700">
              Role
            </Label>
            <Select name="role" required>
              <SelectTrigger className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2 rounded-md">
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
            className="bg-pink-500 hover:bg-pink-600 text-white py-3 text-lg font-medium rounded-md"
          >
            Sign up
          </SubmitButton>

          <p className="text-center text-sm text-gray-600 mt-4">
            By signing up, you agree to our{" "}
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
