import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { CheckIcon, EditIcon, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PresentationPage({ params }: { params: { id: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch presentation data based on params.id
  }, [params.id]);

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => setIsEditing(!isEditing)}
        variant={isEditing ? "default" : "outline"}
        className={cn(
          "flex items-center gap-2",
          isEditing && "bg-blue-600 hover:bg-blue-700"
        )}
      >
        {isEditing ? <CheckIcon className="h-4 w-4" /> : <EditIcon className="h-4 w-4" />}
        <span>{isEditing ? "Done" : "Edit"}</span>
      </Button>

      <Button
        onClick={() => setIsSettingsOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Settings2 className="h-4 w-4" />
        <span>Settings</span>
      </Button>
    </div>
  );

  return (
    <div>
      {/* Render presentation content */}
      {renderActionButtons()}
    </div>
  );
}
