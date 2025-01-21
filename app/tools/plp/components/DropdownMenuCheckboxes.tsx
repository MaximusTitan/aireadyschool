"use client";

import * as React from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Checked = DropdownMenuCheckboxItemProps["checked"];

interface DropdownMenuCheckboxesProps {
  onSelect: (selected: string[]) => void;
}

export function DropdownMenuCheckboxes({
  onSelect,
}: DropdownMenuCheckboxesProps) {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

  const handleCheckboxChange = (item: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedItems, item]
      : selectedItems.filter((i) => i !== item);
    setSelectedItems(newSelected);
    onSelect(newSelected);
  };

  const items = [
    "Comprehension",
    "Understands instructions",
    "Grasps new concepts",
    "Retains information",
    "Attention",
    "Focus duration",
    "Task completion",
    "Follows routines",
    "Participation",
    "Class engagement",
    "Asks questions",
    "Group work",
  ];

  if (!items || !Array.isArray(items)) {
    return null; // or render a fallback UI
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Select Cognitive Parameters</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Cognitive Parameters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item}
            checked={selectedItems.includes(item)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(item, checked as boolean)
            }
          >
            {item}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
