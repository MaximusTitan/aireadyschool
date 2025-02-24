"use client";

import { useState, useEffect } from "react";
import type { Board, Subject, Teacher } from "../types";
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

interface TeachersListProps {
  schoolId: string;
}

export default function TeachersList({ schoolId }: TeachersListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    board: "",
    subject: "",
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchBoards = async () => {
      const { data } = await supabase
        .from("boards")
        .select("id, name")
        .eq("school_id", schoolId);
      setBoards(data || []);
    };

    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, board_id");
      setSubjects(data || []);
    };

    fetchBoards();
    fetchSubjects();
  }, [schoolId, supabase]);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("teachers")
        .select(
          `
          id,
          user_emails!inner (
            email
          ),
          assignments:teacher_assignments (
            id,
            boards!inner (
              id,
              name
            ),
            grades!inner (
              name
            ),
            sections!inner (
              name
            ),
            subjects!inner (
              id,
              name
            )
          )
        `
        )
        .eq("school_id", schoolId);

      if (data) {
        let filteredData = data.map((teacher: any) => ({
          id: teacher.id,
          auth: {
            email: teacher.user_emails.email || "",
          },
          assignments: teacher.assignments.map((assignment: any) => ({
            id: assignment.id,
            board: {
              id: assignment.boards.id,
              name: assignment.boards.name,
            },
            grade: {
              name: assignment.grades.name,
            },
            section: {
              name: assignment.sections.name,
            },
            subject: {
              id: assignment.subjects.id,
              name: assignment.subjects.name,
            },
          })),
        })) as Teacher[];

        // Apply filters
        if (filters.search) {
          filteredData = filteredData.filter((teacher) =>
            teacher.auth.email
              .toLowerCase()
              .includes(filters.search.toLowerCase())
          );
        }

        if (filters.board) {
          filteredData = filteredData.filter((teacher) =>
            teacher.assignments?.some((a) => a.board.id === filters.board)
          );
        }

        if (filters.subject) {
          filteredData = filteredData.filter((teacher) =>
            teacher.assignments?.some((a) => a.subject.id === filters.subject)
          );
        }

        setTeachers(filteredData);
      }
      setLoading(false);
    };

    fetchTeachers();
  }, [schoolId, supabase, filters]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by email"
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
          value={filters.subject}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              subject: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Assignments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell>{teacher.auth.email}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {teacher.assignments?.length ? (
                    teacher.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="text-sm text-muted-foreground"
                      >
                        {`${assignment.board.name} - Grade ${assignment.grade.name} ${assignment.section.name} - ${assignment.subject.name}`}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No assignments
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
