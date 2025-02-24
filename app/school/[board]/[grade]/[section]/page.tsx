"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Section,
  Subject,
  Teacher,
  TeacherData,
  Student,
} from "@/app/school/types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function SectionPage({
  params,
}: {
  params: Promise<{ board: string; grade: string; section: string }>;
}) {
  const resolvedParams = use(params);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const decodedBoardName = decodeURIComponent(resolvedParams.board);
  const decodedGradeName = decodeURIComponent(resolvedParams.grade);
  const decodedSectionName = decodeURIComponent(resolvedParams.section).replace(
    "Section-",
    ""
  );
  const supabase = createClient();

  useEffect(() => {
    const fetchSectionData = async () => {
      // Get the current user's school_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's school site_id
      const { data: userData } = await supabase
        .from("users")
        .select("site_id")
        .eq("user_id", user.id)
        .single();

      if (!userData?.site_id) return;

      // Get board data
      const { data: boardData } = await supabase
        .from("boards")
        .select("id")
        .eq("school_id", userData.site_id)
        .eq("name", decodedBoardName)
        .single();

      if (!boardData) return;

      // Get grade data
      const { data: gradeData } = await supabase
        .from("grades")
        .select("id")
        .eq("board_id", boardData.id)
        .eq("name", decodedGradeName)
        .single();

      if (!gradeData) return;

      // Get section data
      const { data: sectionData } = await supabase
        .from("sections")
        .select("id")
        .eq("grade_id", gradeData.id)
        .eq("name", decodedSectionName)
        .single();

      if (!sectionData) return;

      // Fetch subjects for this board
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("board_id", boardData.id);

      setSubjects((subjectsData || []) as Subject[]);

      interface TeacherAssignmentResponse {
        teacher: {
          id: string;
          user_id: string;
        };
        subject: {
          id: string;
          name: string;
        };
      }

      // Fetch teachers and their assignments
      const { data: teacherAssignments } = await supabase
        .from("teacher_assignments")
        .select(
          `
          teacher:teachers!inner (
            id,
            user_id
          ),
          subject:subjects!inner (
            id,
            name
          )
        `
        )
        .eq("board_id", boardData.id)
        .eq("grade_id", gradeData.id)
        .eq("section_id", sectionData.id);

      if (teacherAssignments) {
        interface TeacherEmailData {
          id: string;
          email: string;
          subject: {
            id: string;
            name: string;
          };
        }

        // Fetch teacher emails from auth.users
        const teacherEmails: TeacherEmailData[] = await Promise.all(
          teacherAssignments.map(async (ta: any) => {
            const { data: userData } = await supabase
              .from("users")
              .select("email")
              .eq("user_id", ta.teacher.user_id)
              .single();
            return {
              id: ta.teacher.id,
              email: userData?.email || "No email found",
              subject: ta.subject,
            };
          })
        );

        const processedTeachers: Teacher[] = teacherEmails.map((teacher) => ({
          id: teacher.id,
          auth: {
            email: teacher.email,
          },
          subject: {
            id: teacher.subject.id,
            name: teacher.subject.name,
            board_id: boardData.id,
          },
        }));

        setTeachers(processedTeachers);
      }

      // Fetch students for this section
      const { data: studentsData } = await supabase
        .from("school_students")
        .select("id, user_id, roll_number")
        .eq("section_id", sectionData.id);

      if (studentsData) {
        // Fetch student emails from auth.users
        const studentEmails: Student[] = await Promise.all(
          (studentsData || []).map(
            async (student: {
              id: string;
              user_id: string;
              roll_number?: string;
            }) => {
              const { data: userData } = await supabase
                .from("users")
                .select("email")
                .eq("user_id", student.user_id)
                .single();
              return {
                id: student.id,
                auth: {
                  email: userData?.email || "No email found",
                },
                roll_number: student.roll_number,
              };
            }
          )
        );
        setStudents(studentEmails);
      }
    };

    fetchSectionData();
  }, [decodedBoardName, decodedGradeName, decodedSectionName]);

  return (
    <div className="container py-10">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/school">School</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/school/${resolvedParams.board}`}>
              {decodedBoardName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/school/${resolvedParams.board}/${resolvedParams.grade}`}
            >
              {decodedGradeName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Section {decodedSectionName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-8">Section {decodedSectionName}</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-6">Teachers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teachers.length > 0 ? (
              teachers.map((teacher) => (
                <Card key={`${teacher.id}-${teacher.subject?.id}`}>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">
                      Teacher Email: {teacher.auth.email}
                    </h3>
                    <p className="text-muted-foreground">
                      {teacher.subject?.name || "No subject assigned"}
                    </p>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <p>No teachers assigned to this section yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="hover:bg-muted transition-colors"
                >
                  <CardHeader>
                    <h3 className="text-xl font-semibold">{subject.name}</h3>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <p>No subjects available for this board.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Students</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {students.length > 0 ? (
              students.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">
                      {student.auth.email}
                    </h3>
                    {student.roll_number && (
                      <p className="text-muted-foreground">
                        Roll Number: {student.roll_number}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              ))
            ) : (
              <p>No students enrolled in this section yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
