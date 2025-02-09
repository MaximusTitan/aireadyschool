"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import logo from "@/public/logo.webp";

export default function VerificationWaiting() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const status = session?.user?.user_metadata?.status;

    if (status === "active") {
      router.push("/tools");
    }
    setIsChecking(false);
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
              src={logo}
              alt="AI Ready School Logo"
              width={150}
              height={150}
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
            className="mt-4 bg-primary text-white hover:bg-primary/90"
          >
            {isChecking ? "Checking..." : "Check Status"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
