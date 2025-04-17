"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManageSubscription() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Opening..." : "Manage Subscription"}
    </button>
  );
}
