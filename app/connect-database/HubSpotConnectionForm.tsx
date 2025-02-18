"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card,CardContent,CardHeader,CardTitle,CardDescription,CardFooter,} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface HubSpotConnectionFormProps {
  crmAccessToken: string | null;
  setCrmAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}
const HubSpotConnectionForm: React.FC<HubSpotConnectionFormProps> = ({
  crmAccessToken,
  setCrmAccessToken,
  handleSubmit,
  isLoading,
}) => {
  const [accessToken, setAccessToken] = useState(crmAccessToken || "");
  const [crmName, setCrmName] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "guest@example.com");
      }
    };
    fetchUser();
  }, []);

  const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConnectionStatus(null);

    try {
      const response = await fetch("/api/connect-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubspotAccessToken: accessToken,
          crmName,
          email: userEmail,
        }),
      });
      console.log("Response status:", response.status); // Add this line for debugging

      const result = await response.json();
      console.log("API response:", result);

      if (result.success) {
        setIsConnected(true);
        setConnectionStatus({ success: true, message: result.message });
      } else {
        setConnectionStatus({
          success: false,
          message: result.error || "Failed to connect to HubSpot",
        });
      }
    } catch (error) {
      console.error("Error connecting to HubSpot:", error);
      setConnectionStatus({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to HubSpot</CardTitle>
        <CardDescription>
          Enter your HubSpot Private App Access Token to connect.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleConnect}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crmName">Name your CRM</Label>
            <Input
              id="crmName"
              type="text"
              placeholder="Enter a name for your CRM connection"
              value={crmName}
              onChange={(e) => setCrmName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hubspotAccessToken">HubSpot Access Token</Label>
            <Input
              id="hubspotAccessToken"
              type="password"
              placeholder="Enter your HubSpot Private App Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              required
            />
          </div>
          {connectionStatus && (
            <Alert
              variant={connectionStatus.success ? "default" : "destructive"}
            >
              {connectionStatus.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {connectionStatus.success ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>{connectionStatus.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isConnected}
          >
            {isLoading
              ? "Connecting..."
              : isConnected
                ? "Connected"
                : "Connect"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default HubSpotConnectionForm;