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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
  userCosts: Record<string, number>;
  toolCosts: Record<string, number>;
  topUsers: { email: string; cost: number }[];
  topTools: { name: string; cost: number }[];
}

interface SortConfig {
  column: keyof Log | null;
  direction: "asc" | "desc";
}

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
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
  const [viewMode, setViewMode] = useState<"logs" | "analysis">("logs");
  const itemsPerPage = 10;
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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
    const userCosts: Record<string, number> = {};
    const toolCosts: Record<string, number> = {};
    let totalCost = 0;
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    logsData.forEach((log) => {
      userCosts[log.user_email] =
        (userCosts[log.user_email] || 0) + log.total_cost;
      toolCosts[log.tool_name] =
        (toolCosts[log.tool_name] || 0) + log.total_cost;
      totalCost += log.total_cost;
      totalTokens += log.total_tokens;
      inputTokens += log.input_tokens;
      outputTokens += log.output_tokens;
    });

    const topUsers = Object.entries(userCosts)
      .map(([email, cost]) => ({ email, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    const topTools = Object.entries(toolCosts)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      totalCost,
      totalTokens,
      inputTokens,
      outputTokens,
      userCosts,
      toolCosts,
      topUsers,
      topTools,
    };
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

  const renderAnalysisView = () => {
    const stats = calculateStats(filteredLogs);

    // Process data for charts
    const processChartData = (
      data: { label: string; value: number }[]
    ): ChartDataItem[] => {
      if (data.length <= 5) {
        return data.map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length],
        }));
      }

      const topFive = data.slice(0, 5).map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length],
      }));

      const othersSum = data
        .slice(5)
        .reduce((sum, item) => sum + item.value, 0);

      return [
        ...topFive,
        { label: "Others", value: othersSum, color: "#CBD5E1" },
      ];
    };

    const userChartData = processChartData(
      stats.topUsers.map((user) => ({
        label: user.email,
        value: user.cost,
      }))
    );

    const toolChartData = processChartData(
      stats.topTools.map((tool) => ({
        label: tool.name,
        value: tool.cost,
      }))
    );

    // Prepare bar chart data
    const barChartData = stats.topUsers.slice(0, 10).map((user) => ({
      name: user.email.split("@")[0], // Show only username part
      cost: Number(user.cost.toFixed(4)),
    }));

    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Cost</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userChartData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percent }) =>
                      `${label}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {userChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(4)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Tools by Cost</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={toolChartData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percent }) =>
                      `${label}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {toolChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(4)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Users Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value) => `$${value}`}
                  labelFormatter={(label) => `User: ${label}`}
                />
                <Bar dataKey="cost" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Keep the existing detailed cost breakdown table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>${user.cost.toFixed(4)}</TableCell>
                    <TableCell>
                      {((user.cost / stats.totalCost) * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
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
          <CardTitle>Usage Analysis</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "logs" ? "secondary" : "outline"}
              onClick={() => setViewMode("logs")}
            >
              Logs View
            </Button>
            <Button
              variant={viewMode === "analysis" ? "secondary" : "outline"}
              onClick={() => setViewMode("analysis")}
            >
              Cost Analysis
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "logs" ? (
            <>
              <div className="flex flex-col gap-4 mb-4 md:flex-row">
                <Select
                  onValueChange={(value) =>
                    setFilters({ ...filters, tool: value })
                  }
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
                  <p className="text-sm text-muted-foreground">
                    Loading logs...
                  </p>
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
                            <TableCell>
                              {formatNumber(log.input_tokens)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(log.output_tokens)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(log.total_tokens)}
                            </TableCell>
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
            </>
          ) : (
            renderAnalysisView()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
