"use client";
import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import IdeaCard from "@/app/dat/components/IdeaCard";
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
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
const ITEMS_PER_PAGE = 10;

// Extend Student interface to include the idea and presentation relations
interface Student {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  school_name: string | null;
  city: string | null;
  group: string | null;
  admission_no: string;
  school_id: string;
  ideas?: {
    title?: string;
    status:
      | "not_submitted"
      | "review_pending"
      | "update_needed"
      | "review_updated"
      | "rejected"
      | "approved"
      | null;
  };
  presentation?: {
    status:
      | "not_submitted"
      | "review_pending"
      | "update_needed"
      | "review_updated"
      | "rejected"
      | "qualified_for_round1"
      | "submit_presentation"
      | "round1_winner"
      | "round1_runner_up"
      | null;
    presentation_link?: string; // Add this field to track if presentation is submitted
  };
  prototype?: {
    status:
      | "not_submitted"
      | "review_pending"
      | "update_needed"
      | "review_updated"
      | "rejected"
      | "approved"
      | "qualified_for_round2"
      | "round2_winner"
      | "round2_runner_up"
      | "finals_winner"
      | "finals_runner_up"
      | null;
  };
}

// Add this interface near the top with other interfaces
interface SelectedIdea {
  id: string;
  title: string;
  brief_description: string;
  why_this_idea: string;
  how_get_this_idea: string;
  status:
    | "not_submitted"
    | "review_pending"
    | "update_needed"
    | "review_updated"
    | "rejected"
    | "approved";
  admin_suggestions?: string;
  created_at: string;
}

interface Rating {
  student_id: string;
  judge_id: string;
  round: string;
  total_score: number;
}

// Add this interface with the other interfaces at the top
interface StudentDetails {
  school_id: string;
  group: string;
  city: string;
}

// Add this interface for filters
interface Filters {
  group: string[];
  school: string[];
  city: string[];
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
  if (student.ideas?.status && student.ideas.status !== "not_submitted") {
    const status = student.ideas.status;
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
    student.ideas?.status === "not_submitted",
  idea_review_pending: (student: Student) =>
    student.ideas?.status === "review_pending",
  idea_update_needed: (student: Student) =>
    student.ideas?.status === "update_needed",
  idea_review_updated: (student: Student) =>
    student.ideas?.status === "review_updated",
  idea_rejected: (student: Student) => student.ideas?.status === "rejected",
  idea_approved: (student: Student) => student.ideas?.status === "approved",

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

// Move sortStudents function outside component and make it a pure function
function sortStudents(
  students: Student[],
  ratings: { [key: string]: Rating[] },
  config: SortConfig
): Student[] {
  return [...students].sort((a, b) => {
    if (config.field === "name") {
      return config.direction === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    const aRating = getMostAdvancedRatings(a.id, ratings)?.average || "0";
    const bRating = getMostAdvancedRatings(b.id, ratings)?.average || "0";
    const comparison = parseFloat(aRating) - parseFloat(bRating);
    return config.direction === "asc" ? comparison : -comparison;
  });
}

// Rename the existing component to StudentsListContent
interface SortConfig {
  field: "name" | "ratings";
  direction: "asc" | "desc";
}

function StudentsListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get all filters from URL
  const schoolId = searchParams.get("schoolId");
  const fromSchool = searchParams.get("fromSchool");
  const groupFromUrl = searchParams.get("group");
  const pageFromUrl = searchParams.get("page");
  const schoolsFromUrl = searchParams.get("schools")?.split(",") || [];
  const citiesFromUrl = searchParams.get("cities")?.split(",") || [];
  const statusesFromUrl = searchParams.get("statuses")?.split(",") || [];

  // Initialize filters from URL params
  const [filters, setFilters] = useState<Filters>({
    group: groupFromUrl ? [groupFromUrl] : [],
    school: schoolsFromUrl,
    city: citiesFromUrl,
    status: statusesFromUrl,
  });

  // Initialize page from URL
  const [currentPage, setCurrentPage] = useState(
    pageFromUrl ? parseInt(pageFromUrl) : 1
  );

  // Update URL when filters or page changes
  const updateUrlParams = useCallback(
    (newFilters: Filters, page: number) => {
      const params = new URLSearchParams(searchParams);

      // Update filter params
      if (newFilters.school.length)
        params.set("schools", newFilters.school.join(","));
      else params.delete("schools");

      if (newFilters.city.length)
        params.set("cities", newFilters.city.join(","));
      else params.delete("cities");

      if (newFilters.group.length)
        params.set("group", newFilters.group.join(","));
      else params.delete("group");

      if (newFilters.status.length)
        params.set("statuses", newFilters.status.join(","));
      else params.delete("statuses");

      // Update page param
      if (page > 1) params.set("page", page.toString());
      else params.delete("page");

      // Preserve schoolId and fromSchool if they exist
      if (schoolId) params.set("schoolId", schoolId);
      if (fromSchool) params.set("fromSchool", fromSchool);

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, schoolId, fromSchool, searchParams]
  );

  // Update URL when filters change
  useEffect(() => {
    updateUrlParams(filters, currentPage);
  }, [filters, currentPage, updateUrlParams]);

  // Modify handleMultiSelectChange
  const handleMultiSelectChange = (type: keyof Filters, value: string) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [type]: prev[type].includes(value)
          ? prev[type].filter((item) => item !== value)
          : [...prev[type], value],
      };
      return newFilters;
    });
  };

  // Modify setCurrentPage usage in pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIdea, setSelectedIdea] = useState<SelectedIdea | null>(null);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [tempStatus, setTempStatus] = useState<{
    [key: string]:
      | "not_submitted"
      | "review_pending"
      | "update_needed"
      | "review_updated"
      | "rejected"
      | "approved";
  }>({});
  const [studentRatings, setStudentRatings] = useState<{
    [key: string]: Rating[];
  }>({});
  const [round1WinnersByGroup, setRound1WinnersByGroup] = useState<{
    [key: string]: boolean;
  }>({});
  const [round1RunnerUpsByGroup, setRound1RunnerUpsByGroup] = useState<{
    [key: string]: boolean;
  }>({});
  const [round2WinnersByCity, setRound2WinnersByCity] = useState<{
    [key: string]: boolean;
  }>({});
  const [round2RunnerUpsByCity, setRound2RunnerUpsByCity] = useState<{
    [key: string]: boolean;
  }>({});
  const [finalsWinnersByGroup, setFinalsWinnersByGroup] = useState<{
    [key: string]: boolean;
  }>({});
  const [finalsRunnerUpsByGroup, setFinalsRunnerUpsByGroup] = useState<{
    [key: string]: boolean;
  }>({});
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const predefinedCities = [
    "DELHI",
    "RAIPUR",
    "MUMBAI",
    "PUNE",
    "BANGALORE",
    "HYDERABAD",
    "CHENNAI",
    "LUCKNOW",
    "VIZAG",
    "VIJAYAWADA",
    "BHOPAL",
  ];
  const [groups] = useState(["A", "B", "C", "D"]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });

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

  // Add this new function to fetch schools and cities
  const fetchFiltersData = useCallback(async () => {
    const { data: schoolsData } = await supabase
      .from("dat_school_details")
      .select("id, school_name")
      .order("school_name");
    if (schoolsData) {
      setSchools(
        schoolsData.map((school) => ({
          id: school.id,
          name: school.school_name || "Unnamed School",
        }))
      );
    }
  }, []); // Empty dependency array since it doesn't depend on any state/props

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

  // Modify the fetchStudents dependencies
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // First fetch students with their ideas
      let query = supabase.from("dat_student_details").select(
        `
          id,
          name,
          email,
          grade,
          school_name,
          city,
          "group",
          admission_no,
          school_id,
          photo,
          ideas!ideas_student_id_fkey (
            status,
            title
          )
        `,
        { count: "exact" }
      );

      // Apply filters with .in() for multiple values
      if (filters.school.length > 0 && !filters.school.includes("all")) {
        query = query.in("school_id", filters.school);
      }
      if (filters.city.length > 0 && !filters.city.includes("all")) {
        query = query.in("city", filters.city);
      }

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

      // Only add school_id filter if schoolId is provided
      if (schoolId) {
        query = query.eq("school_id", schoolId);
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
            school_name: student.school_name,
            city: student.city,
            group: student.group,
            admission_no: student.admission_no,
            school_id: student.school_id,
            ideas:
              Array.isArray(student.ideas) && student.ideas.length > 0
                ? {
                    title: student.ideas[0].title,
                    status: student.ideas[0].status || "not_submitted",
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
        if (filters.status.length > 0) {
          filteredStudents = transformed.filter((student) =>
            hasSelectedStatus(student, filters.status)
          );
        }

        // After getting transformed students data, check for winners/runners-up
        // Get Round 1 (school-group level)
        const { data: round1Data } = await supabase
          .from("dat_presentation_links")
          .select(
            `
            status,
            student_id,
            student_details:student_details!inner (
              school_id,
              group
            )
          `
          )
          .in("status", ["round1_winner", "round1_runner_up"]);
        const winnersByGroup: { [key: string]: boolean } = {};
        const runnerUpsByGroup: { [key: string]: boolean } = {};
        if (round1Data) {
          round1Data.forEach((entry) => {
            // Properly type and handle the student_details data
            const studentDetails = Array.isArray(entry.student_details)
              ? (entry.student_details[0] as StudentDetails)
              : (entry.student_details as StudentDetails);

            // Check if studentDetails exists and has required properties
            if (studentDetails?.school_id && studentDetails?.group) {
              const key = `${studentDetails.school_id}-${studentDetails.group}`;
              if (entry.status === "round1_winner") {
                winnersByGroup[key] = true;
              }
              if (entry.status === "round1_runner_up") {
                runnerUpsByGroup[key] = true;
              }
            }
          });
        }

        // Check Round 2 (city-group level) - modified to include group
        const { data: round2Data } = await supabase
          .from("dat_prototype_links")
          .select(
            `
            status,
            student_id,
            student_details:student_details!inner(city, group)
          `
          )
          .in("status", ["round2_winner", "round2_runner_up"]);
        const winnersByCityGroup: { [key: string]: boolean } = {};
        const runnerUpsByCityGroup: { [key: string]: boolean } = {};
        if (round2Data) {
          round2Data.forEach((entry) => {
            const studentDetails = Array.isArray(entry.student_details)
              ? entry.student_details[0]
              : entry.student_details;

            if (studentDetails?.city && studentDetails?.group) {
              const key = `${studentDetails.city}-${studentDetails.group}`;
              if (entry.status === "round2_winner") {
                winnersByCityGroup[key] = true;
              }
              if (entry.status === "round2_runner_up") {
                runnerUpsByCityGroup[key] = true;
              }
            }
          });
        }

        // Check Finals (group level) instead of global
        const { data: finalsData } = await supabase
          .from("dat_prototype_links")
          .select(
            `
            status,
            student_id,
            student_details:student_details!inner(group)
          `
          )
          .in("status", ["finals_winner", "finals_runner_up"]);
        const finalsWinnersByGroup: { [key: string]: boolean } = {};
        const finalsRunnerUpsByGroup: { [key: string]: boolean } = {};
        if (finalsData) {
          finalsData.forEach((entry) => {
            const studentDetails = Array.isArray(entry.student_details)
              ? entry.student_details[0]
              : entry.student_details;

            if (studentDetails?.group) {
              if (entry.status === "finals_winner") {
                finalsWinnersByGroup[studentDetails.group] = true;
              }
              if (entry.status === "finals_runner_up") {
                finalsRunnerUpsByGroup[studentDetails.group] = true;
              }
            }
          });
        }

        // Update all states
        setRound1WinnersByGroup(winnersByGroup);
        setRound1RunnerUpsByGroup(runnerUpsByGroup);
        setRound2WinnersByCity(winnersByCityGroup); // Changed to city-group pairs
        setRound2RunnerUpsByCity(runnerUpsByCityGroup); // Changed to city-group pairs
        // Add new state variables for finals by group
        setFinalsWinnersByGroup(finalsWinnersByGroup);
        setFinalsRunnerUpsByGroup(finalsRunnerUpsByGroup);
        setStudents(filteredStudents);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

        // Fetch ratings
        const { data: ratingsData } = await supabase
          .from("dat_student_ratings")
          .select("*")
          .in("student_id", studentIds);

        if (ratingsData) {
          const ratingsByStudent = ratingsData.reduce(
            (acc: { [key: string]: Rating[] }, rating) => {
              if (!acc[rating.student_id]) {
                acc[rating.student_id] = [];
              }
              acc[rating.student_id].push(rating);
              return acc;
            },
            {}
          );
          setStudentRatings(ratingsByStudent);
        }
      } else {
        setStudents([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error in fetchStudents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, schoolId, filters]); // Remove unnecessary dependencies

  // Fix fetchFiltersData dependencies
  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]); // Add fetchFiltersData to dependencies

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchStudents();
    }, 100); // Add debounce to prevent continuous requests

    return () => clearTimeout(timer);
  }, [fetchStudents]); // Only depend on fetchStudents

  // Fix sorting effect dependencies
  const sortedStudents = useMemo(() => {
    return sortStudents(students, studentRatings, sortConfig);
  }, [students, studentRatings, sortConfig]);

  const handleIdeaClick = async (studentId: string) => {
    try {
      const { data: ideaData, error } = await supabase
        .from("dat_ideas")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (error) throw error;
      if (ideaData) {
        setSelectedIdea(ideaData);
        setIsIdeaModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching idea details:", error);
    }
  };

  // Update handleApproval to use fetchStudents
  const handleApproval = async (
    ideaId: string,
    newStatus: "approved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("dat_ideas")
      .update({ status: newStatus })
      .eq("id", ideaId);

    if (!error) {
      setSelectedIdea((prev: SelectedIdea | null) =>
        prev ? { ...prev, status: newStatus } : null
      );
      fetchStudents(); // Now this reference will work
    }
  };

  // Update submitStatus to use fetchStudents
  const submitStatus = async (ideaId: string) => {
    const newStatus = tempStatus[ideaId];
    const { error } = await supabase
      .from("dat_ideas")
      .update({ status: newStatus })
      .eq("id", ideaId);

    if (!error) {
      setSelectedIdea((prev: SelectedIdea | null) =>
        prev ? { ...prev, status: newStatus } : null
      );
      setEditingStatus((prev) => ({ ...prev, [ideaId]: false }));
      fetchStudents(); // Now this reference will work
    }
  };

  // Update submitSuggestion to accept both ideaId and suggestion parameters
  const submitSuggestion = async (ideaId: string, suggestion: string) => {
    if (!selectedIdea) return;
    const { error } = await supabase
      .from("dat_ideas")
      .update({
        admin_suggestions: suggestion,
        status: "update_needed",
      })
      .eq("id", ideaId);

    if (!error) {
      setSelectedIdea((prev: SelectedIdea | null) =>
        prev
          ? {
              ...prev,
              admin_suggestions: suggestion,
              status: "update_needed",
            }
          : null
      );
      fetchStudents();
    }
  };

  // Add this function before the return statement
  const handleNotifyIdeaChanges = async (): Promise<void> => {
    // Since this is the admin view, we don't need to implement the notification logic
    // but we still need to return a Promise to match the type
    return Promise.resolve();
  };

  // Add this helper function to get the most advanced ratings
  function getMostAdvancedRatings(
    studentId: string,
    studentRatings: { [key: string]: Rating[] }
  ) {
    const ratings = studentRatings[studentId] || [];

    // Try to get Finals ratings first
    const finalsRatings = ratings.filter((r) => r.round === "Finals");
    if (finalsRatings.length > 0) {
      const avgScore =
        finalsRatings.reduce((sum, r) => sum + r.total_score, 0) /
        finalsRatings.length;
      return {
        average: avgScore.toFixed(2),
        count: finalsRatings.length,
        round: "Finals",
      };
    }

    // If no Finals ratings, try Round 2
    const round2Ratings = ratings.filter((r) => r.round === "Round 2");
    if (round2Ratings.length > 0) {
      const avgScore =
        round2Ratings.reduce((sum, r) => sum + r.total_score, 0) /
        round2Ratings.length;
      return {
        average: avgScore.toFixed(2),
        count: round2Ratings.length,
        round: "Round 2",
      };
    }

    // If no Round 2 ratings, try Round 1
    const round1Ratings = ratings.filter((r) => r.round === "Round 1");
    if (round1Ratings.length > 0) {
      const avgScore =
        round1Ratings.reduce((sum, r) => sum + r.total_score, 0) /
        round1Ratings.length;
      return {
        average: avgScore.toFixed(2),
        count: round1Ratings.length,
        round: "Round 1",
      };
    }

    return null;
  }

  const handleStatusChange = async (
    studentId: string,
    type: "presentation" | "prototype",
    newStatus: string
  ) => {
    try {
      const table =
        type === "presentation" ? "presentation_links" : "prototype_links";
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq("student_id", studentId);

      if (error) throw error;
      await fetchStudents(); // Refresh the list and winner/runner-up states
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Update renderStatusActions to include the new logic
  const renderStatusActions = (student: Student) => {
    // Round 1 Actions (existing code)
    if (student.presentation?.status === "qualified_for_round1") {
      const groupKey = `${student.school_id}-${student.group}`;
      const hasWinnerInGroup = round1WinnersByGroup[groupKey];
      const hasRunnerUpInGroup = round1RunnerUpsByGroup[groupKey];

      return (
        <div className="flex gap-2">
          {!hasWinnerInGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleStatusChange(student.id, "presentation", "round1_winner")
              }
            >
              Round 1 Winner
            </Button>
          )}
          {!hasRunnerUpInGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleStatusChange(
                  student.id,
                  "presentation",
                  "round1_runner_up"
                )
              }
            >
              Round 1 Runner Up
            </Button>
          )}
        </div>
      );
    }

    // Round 2 Actions - Update to check by city AND group
    if (student.prototype?.status === "qualified_for_round2") {
      const cityGroupKey = `${student.city || ""}-${student.group || ""}`;
      const hasWinnerInCityGroup = round2WinnersByCity[cityGroupKey];
      const hasRunnerUpInCityGroup = round2RunnerUpsByCity[cityGroupKey];

      return (
        <div className="flex gap-2">
          {!hasWinnerInCityGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleStatusChange(student.id, "prototype", "round2_winner")
              }
            >
              Round 2 Winner
            </Button>
          )}
          {!hasRunnerUpInCityGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleStatusChange(student.id, "prototype", "round2_runner_up")
              }
            >
              Round 2 Runner Up
            </Button>
          )}
        </div>
      );
    }

    // Finals Actions - Update to check by group
    if (
      ["round2_winner", "round2_runner_up"].includes(
        student.prototype?.status || ""
      )
    ) {
      const group = student.group || "";
      const hasFinalsWinnerInGroup = finalsWinnersByGroup[group];
      const hasFinalsRunnerUpInGroup = finalsRunnerUpsByGroup[group];

      return (
        <div className="flex gap-2">
          {!hasFinalsWinnerInGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleStatusChange(student.id, "prototype", "finals_winner")
              }
            >
              Finals Winner
            </Button>
          )}
          {!hasFinalsRunnerUpInGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleStatusChange(student.id, "prototype", "finals_runner_up")
              }
            >
              Finals Runner Up
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  // Add this helper function to check if any student has status actions
  const hasStatusActions = (student: Student): boolean => {
    return (
      student.presentation?.status === "qualified_for_round1" ||
      student.prototype?.status === "qualified_for_round2" ||
      ["round2_winner", "round2_runner_up"].includes(
        student.prototype?.status || ""
      )
    );
  };

  // Add this helper function to check if the column should be shown
  const shouldShowStatusActions = (): boolean => {
    return students.some(hasStatusActions);
  };

  // Add new function to clear all filters
  const clearAllFilters = () => {
    setFilters({
      group: [],
      school: [],
      city: [],
      status: [],
    });
    setCurrentPage(1);
  };

  // Modify the filter UI component
  const FilterSection = () => (
    <div className="flex gap-4">
      {!fromSchool && (
        <>
          <div className="w-full">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between w-full"
                >
                  {filters.school.length > 0
                    ? filters.school.includes("all")
                      ? "All Schools"
                      : `${filters.school.length} selected`
                    : "Select Schools"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search schools..." />
                  <CommandEmpty>No school found.</CommandEmpty>
                  <CommandGroup className="max-h-[500px] overflow-y-auto">
                    <CommandItem onSelect={() => handleSelectAll("school")}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.school.includes("all")
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Select All Schools
                    </CommandItem>
                    {schools.map((school) => (
                      <CommandItem
                        key={school.id}
                        onSelect={() =>
                          handleMultiSelectChange("school", school.id)
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.school.includes(school.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {school.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between w-full"
                >
                  {filters.city.length > 0
                    ? filters.city.includes("all")
                      ? "All Cities"
                      : `${filters.city.length} selected`
                    : "Select Cities"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search cities..." />
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup className="max-h-[400px] overflow-y-auto">
                    <CommandItem onSelect={() => handleSelectAll("city")}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.city.includes("all")
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Select All Cities
                    </CommandItem>
                    {predefinedCities.map((city) => (
                      <CommandItem
                        key={city}
                        onSelect={() => handleMultiSelectChange("city", city)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.city.includes(city)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      <div className="w-full">
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
                      filters.group.includes("all")
                        ? "opacity-100"
                        : "opacity-0"
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
      </div>

      <div className="w-full">
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
                      filters.status.includes("all")
                        ? "opacity-100"
                        : "opacity-0"
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

      <div>
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="bg-rose-500 text-white whitespace-nowrap h-9 hover:bg-rose-700 transition-colors"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );

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

  if (!loading && students.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-8">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-rose-600 ml-4">
              All Students
            </h1>
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
        <div className="flex items-center mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-rose-600 ml-4">
            All Students
          </h1>
        </div>

        <FilterSection />

        {/* Table Layout - Remove Status column */}
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-rose-200">
            <thead>
              <tr className="bg-rose-50">
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-rose-600 sm:pl-6"
                >
                  So. no.
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
                    Student Name & Grade
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
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
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("ratings")}
                    className="hover:bg-transparent"
                  >
                    Ratings
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                >
                  Actions
                </th>
                {shouldShowStatusActions() && (
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-rose-600"
                  >
                    Status Actions
                  </th>
                )}
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
                    <div className="text-xs text-gray-500">
                      {student.group ||
                        `Group ${getGroupFromGrade(student.grade)}`}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <button
                      onClick={() => handleIdeaClick(student.id)}
                      className="hover:text-rose-600 text-left"
                    >
                      {student.ideas?.title || "Not submitted"}
                    </button>
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
                  <td className="px-4 py-2 text-sm">
                    {(() => {
                      const ratings = getMostAdvancedRatings(
                        student.id,
                        studentRatings
                      );

                      if (!ratings) {
                        return (
                          <span className="text-gray-400">No ratings yet</span>
                        );
                      }

                      return (
                        <div className="text-sm">
                          <span className="font-medium text-rose-600">
                            {ratings.average}
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({ratings.count} judges)
                          </span>
                          <div className="text-xs text-gray-400">
                            {ratings.round}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/students/${student.id}/ideas`}>
                      <Button variant="outline" size="sm">
                        View Submission
                      </Button>
                    </Link>
                  </td>
                  {shouldShowStatusActions() && (
                    <td className="px-4 py-2">
                      {renderStatusActions(student)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Updated Dialog with DialogTitle */}
      <Dialog open={isIdeaModalOpen} onOpenChange={setIsIdeaModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Student Idea Details
          </DialogTitle>
          {selectedIdea ? (
            <IdeaCard
              idea={selectedIdea as SelectedIdea}
              submitSuggestion={submitSuggestion}
              editingStatus={editingStatus}
              setEditingStatus={setEditingStatus}
              tempStatus={tempStatus}
              setTempStatus={setTempStatus}
              handleApproval={handleApproval}
              submitStatus={submitStatus}
              cancelEditStatus={(id) =>
                setEditingStatus((prev) => ({ ...prev, [id]: false }))
              }
              notifyIdeaChanges={handleNotifyIdeaChanges}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// We still need these helper functions for other parts of the component

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
export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentsListContent />
    </Suspense>
  );
}

function getMostAdvancedRatings(
  studentId: string,
  studentRatings: { [key: string]: Rating[] }
) {
  const ratings = studentRatings[studentId] || [];

  // Check Finals ratings first (most advanced)
  const finalsRatings = ratings.filter((r) => r.round === "Finals");
  if (finalsRatings.length > 0) {
    const avgScore =
      finalsRatings.reduce((sum, r) => sum + r.total_score, 0) /
      finalsRatings.length;
    return {
      average: avgScore.toFixed(2),
      count: finalsRatings.length,
      round: "Finals",
    };
  }

  // Then check Round 2 ratings
  const round2Ratings = ratings.filter((r) => r.round === "Round 2");
  if (round2Ratings.length > 0) {
    const avgScore =
      round2Ratings.reduce((sum, r) => sum + r.total_score, 0) /
      round2Ratings.length;
    return {
      average: avgScore.toFixed(2),
      count: round2Ratings.length,
      round: "Round 2",
    };
  }

  // Finally check Round 1 ratings
  const round1Ratings = ratings.filter((r) => r.round === "Round 1");
  if (round1Ratings.length > 0) {
    const avgScore =
      round1Ratings.reduce((sum, r) => sum + r.total_score, 0) /
      round1Ratings.length;
    return {
      average: avgScore.toFixed(2),
      count: round1Ratings.length,
      round: "Round 1",
    };
  }

  // Return null if no ratings found
  return null;
}
