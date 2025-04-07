"use client";
import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CircleUser } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 10;

// Extend Student interface to include the idea and presentation relations
interface Student {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  admission_no: string;
  group: string | null;
  dat_ideas?: {
    title?: string;
    status: string | null;
  };
  presentation?: {
    status: string | null;
    presentation_link?: string;
  };
  prototype?: {
    status: string | null;
  };
}

// Add this interface for filters
interface Filters {
  group: string[];
  status: string[];
}

// Add this helper function before the StudentsListContent component
function getDisplayStatus(student: Student): {
  text: string;
  color: string;
  bg: string;
  border: string;
} {
  // Check prototype status first
  if (
    student.prototype?.status &&
    student.prototype.status !== "not_submitted"
  ) {
    const status = student.prototype.status;
    switch (status) {
      case "finals_winner":
        return {
          text: `Prototype: ${formatStatus(status)}`,
          color: "text-yellow-700",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
        };
      case "finals_runner_up":
        return {
          text: `Prototype: ${formatStatus(status)}`,
          color: "text-purple-700",
          bg: "bg-purple-50",
          border: "border-purple-200",
        };
      case "round2_winner":
        return {
          text: `Prototype: ${formatStatus(status)}`,
          color: "text-indigo-700",
          bg: "bg-indigo-50",
          border: "border-indigo-200",
        };
      case "qualified_for_round2":
        return {
          text: `Prototype: ${formatStatus(status)}`,
          color: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      default:
        return {
          text: `Prototype: ${formatStatus(status)}`,
          color: "text-gray-700",
          bg: "bg-gray-50",
          border: "border-gray-200",
        };
    }
  }

  // Check presentation status
  if (
    student.presentation?.status &&
    student.presentation.status !== "not_submitted"
  ) {
    const status = student.presentation.status;
    switch (status) {
      case "round1_winner":
        return {
          text: `Presentation: ${formatStatus(status)}`,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        };
      case "qualified_for_round1":
        return {
          text: `Presentation: ${formatStatus(status)}`,
          color: "text-cyan-700",
          bg: "bg-cyan-50",
          border: "border-cyan-200",
        };
      case "rejected":
        return {
          text: `Presentation: ${formatStatus(status)}`,
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      default:
        return {
          text: `Presentation: ${formatStatus(status)}`,
          color: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
    }
  }

  // Check idea status
  if (
    student.dat_ideas?.status &&
    student.dat_ideas.status !== "not_submitted"
  ) {
    const status = student.dat_ideas.status;
    switch (status) {
      case "approved":
        return {
          text: `Idea: ${formatStatus(status)}`,
          color: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-200",
        };
      case "rejected":
        return {
          text: `Idea: ${formatStatus(status)}`,
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      case "update_needed":
        return {
          text: `Idea: ${formatStatus(status)}`,
          color: "text-amber-700",
          bg: "bg-amber-50",
          border: "border-amber-200",
        };
      case "review_pending":
        return {
          text: `Idea: ${formatStatus(status)}`,
          color: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      default:
        return {
          text: `Idea: ${formatStatus(status)}`,
          color: "text-gray-700",
          bg: "bg-gray-50",
          border: "border-gray-200",
        };
    }
  }

  // Default no submission state
  return {
    text: "No submission yet",
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Update GROUP_GRADE_RANGES to include all grades
const GROUP_GRADE_RANGES = {
  A: ["5", "6"],
  B: ["7", "8"],
  C: ["9", "10"],
  D: ["11", "12"],
};

const STATUS_MAPPING = {
  // Idea statuses
  idea_not_submitted: (student: Student) =>
    student.dat_ideas?.status === "not_submitted",
  idea_review_pending: (student: Student) =>
    student.dat_ideas?.status === "review_pending",
  idea_update_needed: (student: Student) =>
    student.dat_ideas?.status === "update_needed",
  idea_review_updated: (student: Student) =>
    student.dat_ideas?.status === "review_updated",
  idea_rejected: (student: Student) => student.dat_ideas?.status === "rejected",
  idea_approved: (student: Student) => student.dat_ideas?.status === "approved",

  // Presentation statuses
  presentation_not_submitted: (student: Student) =>
    student.presentation?.status === "not_submitted",
  presentation_review_pending: (student: Student) =>
    student.presentation?.status === "review_pending",
  presentation_update_needed: (student: Student) =>
    student.presentation?.status === "update_needed",
  presentation_review_updated: (student: Student) =>
    student.presentation?.status === "review_updated",
  presentation_rejected: (student: Student) =>
    student.presentation?.status === "rejected",
  presentation_qualified_for_round1: (student: Student) =>
    student.presentation?.status === "qualified_for_round1",
  presentation_submit_presentation: (student: Student) =>
    student.presentation?.status === "submit_presentation",
  presentation_round1_winner: (student: Student) =>
    student.presentation?.status === "round1_winner",
  presentation_round1_runner_up: (student: Student) =>
    student.presentation?.status === "round1_runner_up",

  // Prototype statuses
  prototype_not_submitted: (student: Student) =>
    student.prototype?.status === "not_submitted",
  prototype_review_pending: (student: Student) =>
    student.prototype?.status === "review_pending",
  prototype_update_needed: (student: Student) =>
    student.prototype?.status === "update_needed",
  prototype_review_updated: (student: Student) =>
    student.prototype?.status === "review_updated",
  prototype_rejected: (student: Student) =>
    student.prototype?.status === "rejected",
  prototype_qualified_for_round2: (student: Student) =>
    student.prototype?.status === "qualified_for_round2",
  prototype_round2_winner: (student: Student) =>
    student.prototype?.status === "round2_winner",
  prototype_round2_runner_up: (student: Student) =>
    student.prototype?.status === "round2_runner_up",
  prototype_finals_winner: (student: Student) =>
    student.prototype?.status === "finals_winner",
  prototype_finals_runner_up: (student: Student) =>
    student.prototype?.status === "finals_runner_up",
};

// Rename the existing component to StudentsListContent
interface SortConfig {
  field: "name" | "grade";
  direction: "asc" | "desc";
}

function SchoolStudentsListContent() {
  // Add useSearchParams hook at the top of the component
  const searchParams = useSearchParams();
  const groupParam = searchParams.get("group");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    group: groupParam ? [groupParam] : [],
    status: [],
  });
  const [groups] = useState(["A", "B", "C", "D"]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const statusOptions = [
    { value: "all", label: "All Status" },
    // Idea statuses
    { value: "idea_not_submitted", label: "Idea: Not Submitted" },
    { value: "idea_review_pending", label: "Idea: Review Pending" },
    { value: "idea_update_needed", label: "Idea: Update Needed" },
    { value: "idea_review_updated", label: "Idea: Review Updated" },
    { value: "idea_rejected", label: "Idea: Rejected" },
    { value: "idea_approved", label: "Idea: Approved" },

    // Presentation statuses
    {
      value: "presentation_not_submitted",
      label: "Presentation: Not Submitted",
    },
    {
      value: "presentation_review_pending",
      label: "Presentation: Review Pending",
    },
    {
      value: "presentation_update_needed",
      label: "Presentation: Update Needed",
    },
    {
      value: "presentation_review_updated",
      label: "Presentation: Review Updated",
    },
    { value: "presentation_rejected", label: "Presentation: Rejected" },
    {
      value: "presentation_qualified_for_round1",
      label: "Presentation: Qualified for Round 1",
    },
    {
      value: "presentation_submit_presentation",
      label: "Presentation: Submit Presentation",
    },
    {
      value: "presentation_round1_winner",
      label: "Presentation: Round 1 Winner",
    },
    {
      value: "presentation_round1_runner_up",
      label: "Presentation: Round 1 Runner Up",
    },

    // Prototype statuses
    { value: "prototype_not_submitted", label: "Prototype: Not Submitted" },
    { value: "prototype_review_pending", label: "Prototype: Review Pending" },
    { value: "prototype_update_needed", label: "Prototype: Update Needed" },
    { value: "prototype_review_updated", label: "Prototype: Review Updated" },
    { value: "prototype_rejected", label: "Prototype: Rejected" },
    {
      value: "prototype_qualified_for_round2",
      label: "Prototype: Qualified for Round 2",
    },
    { value: "prototype_round2_winner", label: "Prototype: Round 2 Winner" },
    {
      value: "prototype_round2_runner_up",
      label: "Prototype: Round 2 Runner Up",
    },
    { value: "prototype_finals_winner", label: "Prototype: Finals Winner" },
    {
      value: "prototype_finals_runner_up",
      label: "Prototype: Finals Runner Up",
    },
  ];

  const hasSelectedStatus = (
    student: Student,
    selectedStatuses: string[]
  ): boolean => {
    if (selectedStatuses.includes("all")) return true;
    return selectedStatuses.some((status) => {
      const checkStatus = STATUS_MAPPING[status as keyof typeof STATUS_MAPPING];
      return checkStatus ? checkStatus(student) : false;
    });
  };

  // Get the current school ID from the authenticated user
  useEffect(() => {
    const getSchoolId = async () => {
      const supabase = createClient(); // Initialize client
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("dat_school_details")
          .select("id")
          .eq("email", user.email)
          .single();

        if (data) {
          setSchoolId(data.id);
        }
      }
    };

    getSchoolId();
  }, []);

  // Modify the fetchStudents function to use createClient
  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const supabase = createClient(); // Initialize client

      // First fetch students with their ideas
      let query = supabase
        .from("dat_student_details")
        .select(
          `
          id,
          name,
          email,
          grade,
          "group",
          admission_no,
          school_id,
          dat_ideas!dat_ideas_student_id_fkey (
            status,
            title
          )
        `,
          { count: "exact" }
        )
        .eq("school_id", schoolId);

      // Update group filter to use exact grade matching
      if (filters.group.length > 0 && !filters.group.includes("all")) {
        const allowedGrades = filters.group
          .map(
            (group) =>
              GROUP_GRADE_RANGES[group as keyof typeof GROUP_GRADE_RANGES]
          )
          .flat();
        query = query.in("grade", allowedGrades);
      }

      // Add pagination
      query = query
        .order("name")
        .range(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE - 1
        );

      const {
        data: studentsWithIdeas,
        error: studentsError,
        count,
      } = await query;

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        return;
      }

      // Get student IDs
      const studentIds = studentsWithIdeas?.map((s) => s.id) || [];
      if (studentIds.length > 0) {
        // Fetch presentation and prototype data
        const [presentationResponse, prototypeResponse] = await Promise.all([
          supabase
            .from("dat_presentation_links")
            .select("student_id, status, presentation_link")
            .in("student_id", studentIds),
          supabase
            .from("dat_prototype_links")
            .select("student_id, status")
            .in("student_id", studentIds),
        ]);

        // Create lookup maps
        const presentationMap = new Map(
          presentationResponse.data?.map((p) => [p.student_id, p]) || []
        );
        const prototypeMap = new Map(
          prototypeResponse.data?.map((p) => [p.student_id, p]) || []
        );

        // Transform the data
        const transformed: Student[] = (studentsWithIdeas || []).map(
          (student) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            grade: student.grade,
            group: student.group,
            admission_no: student.admission_no,
            dat_ideas:
              Array.isArray(student.dat_ideas) && student.dat_ideas.length > 0
                ? {
                    title: student.dat_ideas[0].title,
                    status: student.dat_ideas[0].status || "not_submitted",
                  }
                : { title: undefined, status: "not_submitted" },
            presentation: presentationMap.has(student.id)
              ? {
                  status:
                    presentationMap.get(student.id)?.status || "not_submitted",
                  presentation_link: presentationMap.get(student.id)
                    ?.presentation_link,
                }
              : { status: "not_submitted", presentation_link: undefined },
            prototype: prototypeMap.has(student.id)
              ? {
                  status:
                    prototypeMap.get(student.id)?.status || "not_submitted",
                }
              : { status: "not_submitted" },
          })
        );

        // Apply status filter
        let filteredStudents = transformed;
        if (filters.status.length > 0 && !filters.status.includes("all")) {
          filteredStudents = transformed.filter((student) =>
            hasSelectedStatus(student, filters.status)
          );
        }

        setStudents(filteredStudents);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      } else {
        setStudents([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error in fetchStudents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, schoolId]);

  useEffect(() => {
    if (schoolId) {
      const timer = setTimeout(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchStudents();
      }, 100); // Add debounce to prevent continuous requests

      return () => clearTimeout(timer);
    }
  }, [fetchStudents, schoolId]);

  // Sort students
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortConfig.field === "name") {
        return sortConfig.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        // Sort by grade
        const gradeA = a.grade || "0";
        const gradeB = b.grade || "0";
        const comparison = parseInt(gradeA) - parseInt(gradeB);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }
    });
  }, [students, sortConfig]);

  // Add this function to handle multiselect changes
  const handleMultiSelectChange = (type: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value],
    }));
  };

  // Add new handler for Select All
  const handleSelectAll = (type: keyof Filters) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes("all") ? [] : ["all"],
    }));
  };

  // Add sort toggle function
  const toggleSort = (field: SortConfig["field"]) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Modify the filter UI component
  const FilterSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Groups Multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="justify-between w-full"
          >
            {filters.group.length > 0
              ? filters.group.includes("all")
                ? "All Groups"
                : `${filters.group.length} selected`
              : "Select Groups"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command>
            <CommandEmpty>No group found.</CommandEmpty>
            <CommandGroup className="max-h-[400px] overflow-y-auto">
              <CommandItem onSelect={() => handleSelectAll("group")}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    filters.group.includes("all") ? "opacity-100" : "opacity-0"
                  )}
                />
                Select All Groups
              </CommandItem>
              {groups.map((group) => (
                <CommandItem
                  key={group}
                  onSelect={() => handleMultiSelectChange("group", group)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filters.group.includes(group)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {`Group ${group} (Grade ${GROUP_GRADE_RANGES[group as keyof typeof GROUP_GRADE_RANGES].join("-")})`}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Status Multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="justify-between w-full"
          >
            {filters.status.length > 0
              ? filters.status.includes("all")
                ? "All Status"
                : `${filters.status.length} selected`
              : "Select Status"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup className="max-h-[500px] overflow-y-auto">
              <CommandItem onSelect={() => handleSelectAll("status")}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    filters.status.includes("all") ? "opacity-100" : "opacity-0"
                  )}
                />
                Select All Status
              </CommandItem>
              {statusOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() =>
                      handleMultiSelectChange("status", option.value)
                    }
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.status.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  useEffect(() => {
    // Update filters when URL parameter changes
    if (groupParam) {
      setFilters((prev) => ({
        ...prev,
        group: [groupParam],
      }));
    }
  }, [groupParam]);

  if (!loading && students.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
            <h1 className="text-3xl font-bold text-rose-600">All Students</h1>
          </div>
          <FilterSection />
          <Card className="shadow-md rounded-xl">
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                No students found for this school.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center">
            <Link href="/dat/school" className="mr-4">
              <Button variant="outline" size="sm" className="hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-rose-600">All Students</h1>
          </div>
          <Link href="/dat/school/profile">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-gray-100"
            >
              <CircleUser className="h-8 w-8 text-rose-600" />
            </Button>
          </Link>
        </div>

        <FilterSection />

        {/* Table Layout - Add Idea Title column */}
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-rose-200">
            <thead>
              <tr className="bg-rose-50">
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-rose-600 sm:pl-6"
                >
                  No.
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                >
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("name")}
                    className="hover:bg-transparent"
                  >
                    Student Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                >
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("grade")}
                    className="hover:bg-transparent"
                  >
                    Grade
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                {/* Add Idea Title column */}
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                >
                  Idea Title
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-200 bg-white">
              {sortedStudents.map((student, index) => (
                <tr key={student.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <div>{student.name}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <div>{student.grade || "Not specified"}</div>
                    <div className="text-xs text-gray-500">
                      {student.group ||
                        `Group ${getGroupFromGrade(student.grade)}`}
                    </div>
                  </td>
                  {/* Add Idea Title cell */}
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {student.dat_ideas?.title || "Not submitted"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {(() => {
                      const status = getDisplayStatus(student);
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${status.color} ${status.bg} ${status.border}`}
                        >
                          {status.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/dat/school/students/${student.id}/ideas`}>
                      <Button variant="outline" size="sm">
                        View Submission
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add this helper function at the component level
function getGroupFromGrade(grade: string | null): string {
  if (!grade) return "";
  const gradeNum = parseInt(grade);
  if (gradeNum <= 6) return "A";
  if (gradeNum <= 8) return "B";
  if (gradeNum <= 10) return "C";
  return "D";
}

// Create a new default export wrapping the content in Suspense
export default function StudentsList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolStudentsListContent />
    </Suspense>
  );
}
