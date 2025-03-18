import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
}

export function PromptInput({ prompt, onPromptChange }: PromptInputProps) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor="prompt">Describe Your Animation</Label>
      <Textarea
        id="prompt"
        placeholder="Be specific about the movement you want to see. For example: 'Make the flower slowly bloom and sway in the wind' or 'Zoom into the center of the image while adding a subtle rotation'"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="border-neutral-500 focus:ring-neutral-500 min-h-[120px]"
      />
    </div>
  );
}
