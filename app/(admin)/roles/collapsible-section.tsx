"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import CreateUserForm from "./create-user-form";

export default function CollapsibleSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-background rounded-lg shadow-sm border"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full flex justify-between p-4">
          <span className="text-xl font-semibold text-foreground">
            Create New User
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-6 pt-0">
        <CreateUserForm />
      </CollapsibleContent>
    </Collapsible>
  );
}
