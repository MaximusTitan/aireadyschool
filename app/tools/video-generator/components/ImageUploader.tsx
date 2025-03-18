import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  selectedImage: string | null;
  onImageSelect: (base64String: string) => void;
}

export function ImageUploader({
  selectedImage,
  onImageSelect,
}: ImageUploaderProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onImageSelect(base64String);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      toast.error("Failed to process image. Please try again.");
      console.error("File processing error:", err);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
      ${selectedImage ? "border-neutral-500" : "border-gray-300 hover:border-neutral-500"}`}
    >
      {selectedImage ? (
        <img
          src={selectedImage}
          alt="Selected"
          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            Drag and drop your image here, or click to select
          </p>
          <Input
            id="picture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("picture")?.click()}
          >
            Select Image
          </Button>
        </div>
      )}
    </div>
  );
}
