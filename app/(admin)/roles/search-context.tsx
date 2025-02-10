"use client";

import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";
import { Filters, DEFAULT_FILTERS } from "./types";

type SearchContextType = {
  search: string;
  setSearch: (search: string) => void;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
  }));

  const value = useMemo(
    () => ({ search, setSearch, filters, setFilters }),
    [search, filters]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
