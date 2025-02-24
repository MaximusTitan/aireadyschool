"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { LogOut, Mail } from "lucide-react";
import newLogo from "@/public/newLogo.png";

export default function VerificationWaiting() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const supabase = createClient();

  const checkStatus = async () => {
    setIsChecking(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const status = session?.user?.user_metadata?.status;

    if (status === "active") {
      router.push("/tools");
    }
    setIsChecking(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@aireadyschool.com";
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background text-foreground">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src={newLogo}
              alt="AI Ready School Logo"
              width={200}
              height={200}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Account Pending Verification
          </h1>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-muted-foreground">
            Your account is currently awaiting administrative verification.
          </p>
          <p className="text-muted-foreground">
            Please check back later or contact your administrator for more
            information.
          </p>
          <Button
            onClick={checkStatus}
            disabled={isChecking}
            className="mt-4 w-full bg-primary text-white hover:bg-primary/90"
          >
            {isChecking ? "Checking..." : "Check Status"}
          </Button>
        </CardContent>
        <Separator className="my-4" />
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleContactSupport}
            variant="outline"
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
