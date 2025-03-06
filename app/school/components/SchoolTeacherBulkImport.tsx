"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Papa from "papaparse";
import { Eye, EyeOff, Pencil, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { createTeacher, createBulkTeachers } from "@/app/actions/auth";

interface TeacherData {
  Name: string;
  Email: string;
  Password: string;
  boardId?: string;
  gradeId?: string;
  sectionId?: string;
  subjectId?: string;
}

interface SchoolTeacherBulkImportProps {
  schoolId: string;
  onSuccess?: () => void;
}

export default function SchoolTeacherBulkImport({
  schoolId,
  onSuccess,
}: SchoolTeacherBulkImportProps) {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bulkPassword, setBulkPassword] = useState("");
  const [editedTeachers, setEditedTeachers] = useState<TeacherData[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [allGrades, setAllGrades] = useState<{ id: string; name: string; board_id: string }[]>([]);
  const [allSections, setAllSections] = useState<{ id: string; name: string; grade_id: string }[]>([]);
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string; board_id: string }[]>([]);
  const supabase = createClient();
  const templateUrl = "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//Teachers's%20Template.csv";

  useEffect(() => {
    setEditedTeachers(teachers);
  }, [teachers]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch boards
      const { data: boardsData } = await supabase
        .from("boards")
        .select("id, name")
        .eq("school_id", schoolId);
      
      if (boardsData) setBoards(boardsData);
      
      // Fetch all grades
      const { data: gradesData } = await supabase
        .from("grades")
        .select("id, name, board_id");
      
      if (gradesData) {
        // Sort grades numerically
        const sortedGrades = gradesData.sort((a, b) => {
          const aNum = parseInt(a.name.replace("Grade ", ""));
          const bNum = parseInt(b.name.replace("Grade ", ""));
          return aNum - bNum;
        });
        setAllGrades(sortedGrades);
      }
      
      // Fetch all sections
      const { data: sectionsData } = await supabase
        .from("sections")
        .select("id, name, grade_id");
      
      if (sectionsData) {
        const sortedSections = sectionsData.sort((a, b) => a.name.localeCompare(b.name));
        setAllSections(sortedSections);
      }
      
      // Fetch all subjects
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, board_id");
      
      if (subjectsData) setAllSubjects(subjectsData);
    };
    
    fetchAllData();
  }, [schoolId, supabase]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Filter out rows with empty fields
        const validTeachers = (results.data as TeacherData[]).filter(
          (teacher) =>
            teacher.Name?.trim() &&
            teacher.Email?.trim() &&
            teacher.Password?.trim()
        );

        if (validTeachers.length < results.data.length) {
          toast({
            title: "Warning",
            description: `${results.data.length - validTeachers.length} rows were removed due to missing data.`,
          });
        }

        // Initialize teachers with empty assignment fields
        const teachersWithAssignments = validTeachers.map(teacher => ({
          ...teacher,
          boardId: "",
          gradeId: "",
          sectionId: "",
          subjectId: ""
        }));

        setTeachers(teachersWithAssignments);
        setIsEditing(true); // Auto enable editing to allow filling assignments
      },
      error: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to parse CSV file. Please check the format.",
        });
      },
    });
  };

  const handleEdit = (
    index: number,
    field: keyof TeacherData,
    value: string
  ) => {
    const newTeachers = [...editedTeachers];
    newTeachers[index] = {
      ...newTeachers[index],
      [field]: value,
    };
    
    // Reset dependent fields if board changes
    if (field === "boardId") {
      newTeachers[index].gradeId = "";
      newTeachers[index].sectionId = "";
      newTeachers[index].subjectId = "";
    }
    
    // Reset section if grade changes
    if (field === "gradeId") {
      newTeachers[index].sectionId = "";
    }
    
    setEditedTeachers(newTeachers);
  };

  const applyBulkPassword = () => {
    if (!bulkPassword.trim()) return;

    const newTeachers = editedTeachers.map((teacher) => ({
      ...teacher,
      Password: bulkPassword,
    }));
    setEditedTeachers(newTeachers);
    setBulkPassword("");
  };

  const saveChanges = () => {
    // Validate all fields are filled
    const hasEmptyFields = editedTeachers.some(
      (teacher) =>
        !teacher.Name?.trim() ||
        !teacher.Email?.trim() ||
        !teacher.Password?.trim()
    );

    if (hasEmptyFields) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name, Email, and Password are required for all teachers.",
      });
      return;
    }

    setTeachers(editedTeachers);
    setIsEditing(false);
  };

  // Get grades for a specific board
  const getGradesForBoard = (boardId: string) => {
    return allGrades.filter(grade => grade.board_id === boardId);
  };

  // Get sections for a specific grade
  const getSectionsForGrade = (gradeId: string) => {
    return allSections.filter(section => section.grade_id === gradeId);
  };

  // Get subjects for a specific board
  const getSubjectsForBoard = (boardId: string) => {
    return allSubjects.filter(subject => subject.board_id === boardId);
  };

  const handleSubmit = async () => {
    if (teachers.length === 0) return;

    // Validate that all teachers have assignments selected
    const incompleteTeachers = teachers.filter(
      t => !t.boardId || !t.gradeId || !t.sectionId || !t.subjectId
    );

    if (incompleteTeachers.length > 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Assignments",
        description: `${incompleteTeachers.length} teachers are missing board, grade, section, or subject assignments.`,
      });
      setIsEditing(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBulkTeachers({
        teachers: teachers.map((teacher) => ({
          name: teacher.Name,
          email: teacher.Email,
          password: teacher.Password,
          schoolId,
          boardId: teacher.boardId!,
          gradeId: teacher.gradeId!,
          sectionId: teacher.sectionId!,
          subjectId: teacher.subjectId!,
        })),
      });

      if (!result.success) throw result.error;

      toast({
        title: "Success",
        description: `Successfully registered ${teachers.length} teachers`,
      });
      onSuccess?.();
      setTeachers([]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register teachers. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button asChild>
          <a href={templateUrl} download>
            Download Template
          </a>
        </Button>
        <Button
          variant="secondary"
          onClick={() => document.getElementById("csvUpload")?.click()}
        >
          Upload CSV
          <input
            id="csvUpload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </Button>
      </div>

      {editedTeachers.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={saveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedTeachers(teachers);
                        setIsEditing(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Passwords
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Passwords
                  </>
                )}
              </Button>
            </div>

            {isEditing && (
              <div className="p-2 border-b flex gap-2 items-center">
                <Input
                  placeholder="Enter password for all teachers"
                  value={bulkPassword}
                  onChange={(e) => setBulkPassword(e.target.value)}
                  type={showPasswords ? "text" : "password"}
                />
                <Button
                  variant="secondary"
                  onClick={applyBulkPassword}
                  disabled={!bulkPassword.trim()}
                >
                  Apply to All
                </Button>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedTeachers.map((teacher, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={teacher.Name}
                            onChange={(e) =>
                              handleEdit(index, "Name", e.target.value)
                            }
                          />
                        ) : (
                          teacher.Name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={teacher.Email}
                            onChange={(e) =>
                              handleEdit(index, "Email", e.target.value)
                            }
                          />
                        ) : (
                          teacher.Email
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type={showPasswords ? "text" : "password"}
                            value={teacher.Password}
                            onChange={(e) =>
                              handleEdit(index, "Password", e.target.value)
                            }
                          />
                        ) : showPasswords ? (
                          teacher.Password
                        ) : (
                          "********"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={teacher.boardId || ""}
                            onValueChange={(value) => handleEdit(index, "boardId", value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select board" />
                            </SelectTrigger>
                            <SelectContent>
                              {boards.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          boards.find(b => b.id === teacher.boardId)?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={teacher.subjectId || ""}
                            onValueChange={(value) => handleEdit(index, "subjectId", value)}
                            disabled={!teacher.boardId}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {teacher.boardId && getSubjectsForBoard(teacher.boardId).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          allSubjects.find(s => s.id === teacher.subjectId)?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={teacher.gradeId || ""}
                            onValueChange={(value) => handleEdit(index, "gradeId", value)}
                            disabled={!teacher.boardId}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {teacher.boardId && getGradesForBoard(teacher.boardId).map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          allGrades.find(g => g.id === teacher.gradeId)?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={teacher.sectionId || ""}
                            onValueChange={(value) => handleEdit(index, "sectionId", value)}
                            disabled={!teacher.gradeId}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {teacher.gradeId && getSectionsForGrade(teacher.gradeId).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          allSections.find(s => s.id === teacher.sectionId)?.name || "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isEditing}
            className="w-full"
          >
            {isSubmitting
              ? `Registering ${editedTeachers.length} teachers...`
              : `Register ${editedTeachers.length} Teachers`}
          </Button>
        </div>
      )}
    </div>
  );
}
