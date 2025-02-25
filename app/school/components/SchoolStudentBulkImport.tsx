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
import { createBulkStudents } from "@/app/actions/auth";
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

interface StudentData {
  Name: string;
  "Roll Number": string;
  Email: string;
  Password: string;
}

interface SchoolStudentBulkImportProps {
  schoolId: string;
  onSuccess?: () => void;
}

export default function SchoolStudentBulkImport({
  schoolId,
  onSuccess,
}: SchoolStudentBulkImportProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bulkPassword, setBulkPassword] = useState("");
  const [editedStudents, setEditedStudents] = useState<StudentData[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const supabase = createClient();
  const templateUrl =
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//Student's%20Template.csv";

  useEffect(() => {
    setEditedStudents(students);
  }, [students]);

  // Fetch boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      const { data } = await supabase
        .from("boards")
        .select("id, name")
        .eq("school_id", schoolId);
      if (data) setBoards(data);
    };
    fetchBoards();
  }, [schoolId, supabase]);

  // When board changes, fetch grades
  const boardChanged = async (boardId: string) => {
    setSelectedBoard(boardId);
    setSelectedGrade("");
    setSelectedSection("");

    const { data: gradesData } = await supabase
      .from("grades")
      .select("id, name")
      .eq("board_id", boardId);

    // Sort grades numerically
    const sortedGrades = (gradesData || []).sort((a, b) => {
      const aNum = parseInt(a.name.replace("Grade ", ""));
      const bNum = parseInt(b.name.replace("Grade ", ""));
      return aNum - bNum;
    });

    setGrades(sortedGrades);
  };

  // When grade changes, fetch sections
  const gradeChanged = async (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedSection("");

    const { data: sectionsData } = await supabase
      .from("sections")
      .select("id, name")
      .eq("grade_id", gradeId);

    setSections(
      (sectionsData || []).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Filter out rows with empty fields
        const validStudents = (results.data as StudentData[]).filter(
          (student) =>
            student.Name?.trim() &&
            student.Email?.trim() &&
            student.Password?.trim() &&
            student["Roll Number"]?.trim()
        );

        if (validStudents.length < results.data.length) {
          toast({
            title: "Warning",
            description: `${results.data.length - validStudents.length} rows were removed due to missing data.`,
          });
        }

        setStudents(validStudents);
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
    field: keyof StudentData,
    value: string
  ) => {
    const newStudents = [...editedStudents];
    newStudents[index] = {
      ...newStudents[index],
      [field]: value,
    };
    setEditedStudents(newStudents);
  };

  const applyBulkPassword = () => {
    if (!bulkPassword.trim()) return;

    const newStudents = editedStudents.map((student) => ({
      ...student,
      Password: bulkPassword,
    }));
    setEditedStudents(newStudents);
    setBulkPassword("");
  };

  const saveChanges = () => {
    // Validate all fields are filled
    const hasEmptyFields = editedStudents.some(
      (student) =>
        !student.Name?.trim() ||
        !student.Email?.trim() ||
        !student.Password?.trim() ||
        !student["Roll Number"]?.trim()
    );

    if (hasEmptyFields) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All fields are required for all students.",
      });
      return;
    }

    setStudents(editedStudents);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (students.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await createBulkStudents({
        students: students.map((student) => ({
          name: student.Name,
          email: student.Email,
          password: student.Password,
          rollNumber: student["Roll Number"],
          schoolId,
          boardId: selectedBoard,
          gradeId: selectedGrade,
          sectionId: selectedSection,
        })),
      });

      if (!result.success) throw result.error;

      toast({
        title: "Success",
        description: `Successfully registered ${students.length} students`,
      });
      onSuccess?.();
      setStudents([]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register students. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Select value={selectedBoard} onValueChange={boardChanged}>
          <SelectTrigger>
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

        <Select
          value={selectedGrade}
          onValueChange={gradeChanged}
          disabled={!selectedBoard}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            {grades.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSection}
          onValueChange={setSelectedSection}
          disabled={!selectedGrade}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBoard && selectedGrade && selectedSection ? (
        <>
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

          {editedStudents.length > 0 && (
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
                            setEditedStudents(students);
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
                      placeholder="Enter password for all students"
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

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedStudents.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={student.Name}
                              onChange={(e) =>
                                handleEdit(index, "Name", e.target.value)
                              }
                            />
                          ) : (
                            student.Name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={student["Roll Number"]}
                              onChange={(e) =>
                                handleEdit(index, "Roll Number", e.target.value)
                              }
                            />
                          ) : (
                            student["Roll Number"]
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={student.Email}
                              onChange={(e) =>
                                handleEdit(index, "Email", e.target.value)
                              }
                            />
                          ) : (
                            student.Email
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type={showPasswords ? "text" : "password"}
                              value={student.Password}
                              onChange={(e) =>
                                handleEdit(index, "Password", e.target.value)
                              }
                            />
                          ) : showPasswords ? (
                            student.Password
                          ) : (
                            "********"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isEditing}
                className="w-full"
              >
                {isSubmitting
                  ? `Registering ${editedStudents.length} students...`
                  : `Register ${editedStudents.length} Students`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          Please select board, grade, and section to proceed with bulk import
        </p>
      )}
    </div>
  );
}
