"use client";

import { useState, useEffect } from "react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import {
  FormCard,
  FormInput,
  ConnectionAlert,
  FormButton,
} from "./FormElements";

interface CRMData {
  hubspotAccessToken: string;
  crmName: string;
}

interface HubSpotConnectionFormProps {
  connectionDetails: CRMData;
  setConnectionDetails: (details: CRMData) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  connectionStatus?: { success: boolean; message: string } | null;
}
const HubSpotConnectionForm: React.FC<HubSpotConnectionFormProps> = ({
  connectionDetails,
  setConnectionDetails,
  handleSubmit,
  isLoading,
  connectionStatus,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConnectionDetails({
      ...connectionDetails,
      [e.target.name]: e.target.value,
    });
  };

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

  return (
    <FormCard
      title="Connect to HubSpot"
      description="Enter your HubSpot Private App Access Token to connect."
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormInput
            label="Name your CRM"
            id="crmName"
            name="crmName"
            type="text"
            placeholder="Enter a name for your CRM connection"
            value={connectionDetails.crmName}
            onChange={handleChange}
            required
          />
          <FormInput
            label="HubSpot Access Token"
            id="hubspotAccessToken"
            name="hubspotAccessToken"
            type="password"
            placeholder="Enter your HubSpot Private App Access Token"
            value={connectionDetails.hubspotAccessToken}
            onChange={handleChange}
            required
          />
          {connectionStatus && <ConnectionAlert {...connectionStatus} />}
        </CardContent>
        <CardFooter>
          <FormButton isLoading={isLoading} type="submit">
            {connectionStatus?.success ? "Connected" : "Connect"}
          </FormButton>
        </CardFooter>
      </form>
    </FormCard>
  );
};

export default HubSpotConnectionForm;

/*
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
*/
