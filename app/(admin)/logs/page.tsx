"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

interface Log {
  id: string;
  tool_name: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
  created_at: string;
  user_email: string;
}

interface Stats {
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
}

interface SortConfig {
  column: keyof Log | null;
  direction: "asc" | "desc";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tool: "all",
    model: "all",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: "desc",
  });
  const itemsPerPage = 10;

  const loadTokenUsageLogs = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("token_usage_logs").select("*");

    if (dateRange.from) {
      query = query.gte("created_at", dateRange.from.toISOString());
    }
    if (dateRange.to) {
      query = query.lte("created_at", dateRange.to.toISOString());
    }

    const { data } = await query.order("created_at", { ascending: false });
    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTokenUsageLogs();
  }, []);

  const uniqueTools = Array.from(new Set(logs.map((log) => log.tool_name)));
  const uniqueModels = Array.from(new Set(logs.map((log) => log.model_name)));

  const calculateStats = (logsData: Log[]): Stats => {
    return logsData.reduce(
      (acc, log) => ({
        totalCost: acc.totalCost + log.total_cost,
        totalTokens: acc.totalTokens + log.total_tokens,
        inputTokens: acc.inputTokens + log.input_tokens,
        outputTokens: acc.outputTokens + log.output_tokens,
      }),
      { totalCost: 0, totalTokens: 0, inputTokens: 0, outputTokens: 0 }
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesTool =
      filters.tool === "all" ? true : log.tool_name === filters.tool;
    const matchesModel =
      filters.model === "all" ? true : log.model_name === filters.model;
    const matchesSearch = filters.search
      ? Object.values(log).some((value) =>
          value.toString().toLowerCase().includes(filters.search.toLowerCase())
        )
      : true;
    return matchesTool && matchesModel && matchesSearch;
  });

  const stats = calculateStats(filteredLogs);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleSort = (column: keyof Log) => {
    setSortConfig({
      column,
      direction:
        sortConfig.column === column && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const sortedAndFilteredLogs = filteredLogs.sort((a, b) => {
    if (!sortConfig.column) return 0;
    const aValue = a[sortConfig.column];
    const bValue = b[sortConfig.column];
    return sortConfig.direction === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const paginatedLogs = sortedAndFilteredLogs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = [
      "Tool",
      "Model",
      "Input Tokens",
      "Output Tokens",
      "Total Tokens",
      "Cost",
      "Created At",
      "User",
    ];
    const csvData = filteredLogs.map((log) => [
      log.tool_name,
      log.model_name,
      log.input_tokens,
      log.output_tokens,
      log.total_tokens,
      log.total_cost,
      formatDate(log.created_at),
      log.user_email,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 m-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toFixed(4)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalTokens)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Input Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.inputTokens)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Output Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.outputTokens)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usage Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4 md:flex-row">
            <Select
              onValueChange={(value) => setFilters({ ...filters, tool: value })}
              defaultValue="all"
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tools</SelectItem>
                {uniqueTools.map((tool) => (
                  <SelectItem key={tool} value={tool}>
                    {tool}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setFilters({ ...filters, model: value })
              }
              defaultValue="all"
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search logs..."
              className="w-[300px]"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[250px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={{
                    from: dateRange.from || undefined,
                    to: dateRange.to || undefined,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from || null,
                      to: range?.to || null,
                    });
                    loadTokenUsageLogs();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading logs...</p>
            </div>
          ) : sortedAndFilteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-sm text-muted-foreground">No logs found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        "Tool",
                        "Model",
                        "Input Tokens",
                        "Output Tokens",
                        "Total Tokens",
                        "Cost",
                        "Created At",
                        "User",
                      ].map((header, index) => (
                        <TableHead key={header}>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              handleSort(
                                header
                                  .toLowerCase()
                                  .replace(" ", "_") as keyof Log
                              )
                            }
                            className="flex items-center"
                          >
                            {header}
                            {sortConfig.column ===
                              header.toLowerCase().replace(" ", "_") && (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.tool_name}</TableCell>
                        <TableCell>{log.model_name}</TableCell>
                        <TableCell>{formatNumber(log.input_tokens)}</TableCell>
                        <TableCell>{formatNumber(log.output_tokens)}</TableCell>
                        <TableCell>{formatNumber(log.total_tokens)}</TableCell>
                        <TableCell>{formatCost(log.total_cost)}</TableCell>
                        <TableCell>{formatDate(log.created_at)}</TableCell>
                        <TableCell>{log.user_email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(page * itemsPerPage, filteredLogs.length)} of{" "}
                  {filteredLogs.length} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page * itemsPerPage >= filteredLogs.length}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
