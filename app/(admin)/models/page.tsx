"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const models = [
  {
    provider: "openai",
    model: "gpt-4o",
    displayName: "GPT-4o",
    description: "Latest GPT-4o model",
  },
  {
    provider: "anthropic",
    model: "claude-3-sonnet-20240620",
    displayName: "Claude 3 Sonnet",
    description: "Anthropic's advanced model.",
  },
];

export default function ModelsPage() {
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCurrentModel();
  }, []);

  async function loadCurrentModel() {
    const { data, error } = await supabase
      .from("model_settings")
      .select("value")
      .eq("key", "chat_model")
      .single();

    if (error) {
      console.error("Error loading model:", error);
      return;
    }

    setCurrentModel(data.value.model);
    setIsLoading(false);
  }

  async function switchModel(
    provider: string,
    model: string,
    displayName: string
  ) {
    setIsLoading(true);

    const { error } = await supabase
      .from("model_settings")
      .update({
        value: { provider, model, displayName },
      })
      .eq("key", "chat_model");

    if (error) {
      console.error("Error switching model:", error);
      return;
    }

    setCurrentModel(model);
    setIsLoading(false);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Model Management</h1>
      <div className="grid gap-6">
        {models.map((model) => (
          <Card key={model.model}>
            <CardHeader>
              <CardTitle>{model.displayName}</CardTitle>
              <CardDescription>{model.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() =>
                  switchModel(model.provider, model.model, model.displayName)
                }
                disabled={currentModel === model.model || isLoading}
                variant={currentModel === model.model ? "secondary" : "default"}
              >
                {currentModel === model.model
                  ? "Currently Active"
                  : "Switch to this model"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
