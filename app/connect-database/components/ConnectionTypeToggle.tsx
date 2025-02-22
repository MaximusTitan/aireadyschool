// components/ConnectionTypeToggle.tsx
import { Button } from "@/components/ui/button";

export type ConnectionType = "sql" | "supabase" | "hubspot";

interface ConnectionTypeToggleProps {
  connectionType: ConnectionType;
  setConnectionType: (type: ConnectionType) => void;
}

const ConnectionTypeToggle = ({
  connectionType,
  setConnectionType,
}: ConnectionTypeToggleProps) => {
  const types: ConnectionType[] = ["sql", "supabase", "hubspot"];
  return (
    <div className="flex justify-center items-center mb-6">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {types.map((type) => (
          <Button
            key={type}
            onClick={() => setConnectionType(type)}
            variant={connectionType === type ? "default" : "outline"}
            className={`px-4 py-2 text-sm font-medium uppercase ${
              connectionType === type
                ? "bg-primary text-primary-foreground"
                : "bg-background"
            }`}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ConnectionTypeToggle;
