"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Teacher, Board, Subject } from "@/app/school/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  Book,
  Eye,
  Mail,
  Search,
  User,
  XCircle,
  Filter,
  BookOpen,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeachersListProps {
  schoolId: string;
}

export default function TeachersList({ schoolId }: TeachersListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    board: "",
    subject: "",
  });
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

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

  // Update filtered subjects when board filter changes
  useEffect(() => {
    if (filters.board) {
      setFilteredSubjects(subjects.filter(s => s.board_id === filters.board));
    } else {
      setFilteredSubjects(subjects);
    }
  }, [filters.board, subjects]);

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

  const clearFilters = () => {
    setFilters({
      search: "",
      board: "",
      subject: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-md border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={filtersExpanded ? "bg-muted" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {(filters.board || filters.subject) && (
                <Badge variant="secondary" className="ml-2 font-normal">
                  {(filters.board ? 1 : 0) + (filters.subject ? 1 : 0)}
                </Badge>
              )}
            </Button>
            
            {(filters.board || filters.subject) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {filtersExpanded && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <Select
              value={filters.board}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  board: value === "all" ? "" : value,
                  subject: "", // Reset subject when board changes
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
              disabled={filteredSubjects.length === 0}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {filteredSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Teacher Assignments</h3>
            <Badge variant="outline">
              {teachers.length} Teacher{teachers.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px] rounded-md">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <User className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No teachers match your filters</p>
                {(filters.board || filters.subject || filters.search) && (
                  <Button 
                    variant="link" 
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Assignments
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {teacher.auth.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignments?.map((assignment, index) => (
                            <TooltipProvider key={index}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs cursor-help">
                                    <Book className="h-3 w-3 mr-1" />
                                    {assignment.subject.name} 
                                    <span className="hidden sm:inline ml-1">
                                      ({assignment.grade.name}-{assignment.section.name})
                                    </span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{assignment.board.name}</p>
                                  <p>{assignment.grade.name} - Section {assignment.section.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {!teacher.assignments?.length && (
                            <span className="text-xs text-muted-foreground italic">No assignments</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Book className="h-4 w-4 mr-2" />
                              Assign Subject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
