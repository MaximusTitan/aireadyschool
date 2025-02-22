"use client";

import { useState, useEffect } from "react";
import type { Board, Grade, Section, Student } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";

interface StudentsListProps {
  schoolId: string;
}

export default function StudentsList({ schoolId }: StudentsListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    board: "",
    grade: "",
    section: "",
  });

  const supabase = createClient();

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      // Fetch boards
      const { data: boardsData } = await supabase
        .from("boards")
        .select("id, name")
        .eq("school_id", schoolId);
      setBoards(boardsData || []);

      // Fetch grades if board is selected
      if (filters.board) {
        const { data: gradesData } = await supabase
          .from("grades")
          .select("id, name")
          .eq("board_id", filters.board);
        setGrades(gradesData || []);
      }

      // Fetch sections if grade is selected
      if (filters.grade) {
        const { data: sectionsData } = await supabase
          .from("sections")
          .select("id, name")
          .eq("grade_id", filters.grade);
        setSections(sectionsData || []);
      }
    };

    fetchFilters();
  }, [schoolId, filters.board, filters.grade, supabase]);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("school_students")
        .select(
          `
          id,
          roll_number,
          user_emails!inner (
            email
          ),
          grades!inner (
            id,
            name,
            boards!inner (
              id,
              name
            )
          ),
          sections!inner (
            id,
            name
          )
        `
        )
        .eq("school_id", schoolId);

      if (data) {
        console.log("Raw student data:", data); // For debugging

        let filteredData = data.map((student: any) => ({
          id: student.id,
          roll_number: student.roll_number,
          auth: {
            email: student.user_emails.email || "",
          },
          grade: {
            id: student.grades.id,
            name: student.grades.name,
            board: {
              id: student.grades.boards.id,
              name: student.grades.boards.name,
            },
          },
          section: {
            id: student.sections.id,
            name: student.sections.name,
          },
        })) as Student[];

        // Apply filters
        if (filters.search) {
          filteredData = filteredData.filter(
            (student) =>
              student.auth.email
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              student.roll_number
                .toLowerCase()
                .includes(filters.search.toLowerCase())
          );
        }

        if (filters.board) {
          filteredData = filteredData.filter(
            (student) => student.grade.board.id === filters.board
          );
        }

        if (filters.grade) {
          filteredData = filteredData.filter(
            (student) => student.grade.id === filters.grade
          );
        }

        if (filters.section) {
          filteredData = filteredData.filter(
            (student) => student.section.id === filters.section
          );
        }

        setStudents(filteredData);
      }
      setLoading(false);
    };

    fetchStudents();
  }, [schoolId, supabase, filters]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by email or roll number"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          className="max-w-xs"
        />
        <Select
          value={filters.board}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              board: value === "all" ? "" : value,
              grade: "",
              section: "",
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Board" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Boards</SelectItem>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.grade}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              grade: value === "all" ? "" : value,
              section: "",
            }))
          }
          disabled={!filters.board}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.section}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              section: value === "all" ? "" : value,
            }))
          }
          disabled={!filters.grade}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll Number</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Board</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Section</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.roll_number}</TableCell>
              <TableCell>{student.auth.email}</TableCell>
              <TableCell>{student.grade.board.name}</TableCell>
              <TableCell>{student.grade.name}</TableCell>
              <TableCell>{student.section.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
