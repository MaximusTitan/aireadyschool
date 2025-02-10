"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "./search-context";

export default function UserSearch() {
  const { search, setSearch } = useSearch();

  return (
    <div className="relative w-72">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}
