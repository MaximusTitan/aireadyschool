import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput"; // Added import

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white">
        <div className="p-6 max-w-md bg-white shadow-lg rounded-lg border border-gray-100">
          <FormMessage message={searchParams} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white">
      <form className="w-full max-w-md px-8 py-12 bg-white shadow-lg rounded-lg border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-rose-500 mb-4">
          Sign up
        </h1>
        <p className="text-sm text-center text-gray-600 mb-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-rose-500 font-medium underline">
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
              className="border-gray-300 focus:border-rose-500 focus:ring-rose-500"
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
              className="border-gray-300 focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="role" className="text-gray-700">
              Role
            </Label>
            <select
              name="role"
              required
              className="border-gray-300 focus:border-rose-500 focus:ring-rose-500 p-2 rounded-md"
            >
              <option value="">Select role</option>
              <option value="Admin">Admin</option>
              <option value="School">School</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>

          <SubmitButton
            formAction={signUpAction}
            pendingText="Signing up..."
            className="bg-rose-500 hover:bg-rose-600 text-white py-3 text-lg font-medium rounded-md"
          >
            Sign up
          </SubmitButton>

          <p className="text-center text-sm text-gray-600 mt-4">
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
