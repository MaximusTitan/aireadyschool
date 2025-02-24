import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMMON_SUBJECTS } from "../constants/education";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubjectSelectorProps {
  selected: string[];
  onSelect: (subject: string) => void;
  onDeselect: (subject: string) => void;
}

export default function SubjectSelector({
  selected,
  onSelect,
  onDeselect,
}: SubjectSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 min-h-[2.5rem] border rounded-lg p-2 mb-2">
        {selected.map((subject) => (
          <Badge
            key={subject}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => onDeselect(subject)}
          >
            {subject} ×
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="Primary">
        <TabsList className="w-full">
          {Object.keys(COMMON_SUBJECTS).map((category) => (
            <TabsTrigger key={category} value={category} className="flex-1">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(COMMON_SUBJECTS).map(([category, subjects]) => (
          <TabsContent key={category} value={category}>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((subject) => (
                  <Button
                    key={subject}
                    variant="outline"
                    size="sm"
                    className={selected.includes(subject) ? "opacity-50" : ""}
                    onClick={() => onSelect(subject)}
                    disabled={selected.includes(subject)}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
