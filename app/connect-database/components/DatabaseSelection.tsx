import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DatabaseOption {
  name: string;
  category: "CRM" | "SQL" | "Cloud";
}

interface DatabaseSelectionProps {
  databases: DatabaseOption[];
  selectedDatabase: string | null;
  onSelect: (database: string, category: "CRM" | "SQL" | "Cloud") => void;
  onPluginClick: () => void;
}

const DatabaseSelection = ({
  databases,
  selectedDatabase,
  onSelect,
  onPluginClick,
}: DatabaseSelectionProps) => {
  return (
    <div className="flex items-center space-x-2">
      <select
        value={selectedDatabase || ""}
        onChange={(e) => {
          const selected = databases.find((db) => db.name === e.target.value);
          if (selected) {
            onSelect(selected.name, selected.category);
          }
        }}
        className="bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded text-sm"
      >
        <option value="" disabled>
          Select Database
        </option>
        {databases.map((db, idx) => (
          <option key={idx} value={db.name}>
            {db.category}: {db.name || "Unnamed Database"}
          </option>
        ))}
      </select>
      <Button
        title="Use plugin"
        aria-label="Use plugin"
        onClick={onPluginClick}
        className="p-2 bg-rose-300 rounded-full text-white hover:bg-rose-400"
      >
        <Plug size={16} />
        <span className="sr-only">Use plugin</span>
      </Button>
    </div>
  );
};

export default DatabaseSelection;
