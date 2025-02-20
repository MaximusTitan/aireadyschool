"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X } from "lucide-react";

interface EditableFieldProps {
  field: string;
  value: string;
  studentEmail: string;
  onUpdate: (newValue: string) => void;
}

export function EditableField({
  field,
  value,
  studentEmail,
  onUpdate,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleEdit = () => {
    if (isEditing) {
      onUpdate(tempValue);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={tempValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTempValue(e.target.value)
            }
            className={
              field === "name"
                ? "text-2xl font-bold h-auto py-1"
                : "h-auto py-1"
            }
          />
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Check className="h-4 w-4 text-green-500" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={field === "name" ? "text-3xl font-bold" : ""}>
            {value}
          </span>
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Edit2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}
