import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
// NEW shadcn components imports
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Assignment {
	grade_id: string;
	section_id: string;
	grade_name: string;
	section_name: string;
}

interface Student {
	id: string;
	email: string;
	grade_name: string;
	section_name: string;
}

export default function AnnouncementSender() {
	const supabase = createClient();
	const [announcementType, setAnnouncementType] = useState<"class" | "student">("class");
	const [teacherId, setTeacherId] = useState<string>("");
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
	// New states for student announcement flow
	const [selectedGrade, setSelectedGrade] = useState<string>("");
	const [selectedSection, setSelectedSection] = useState<string>("");
	const [selectedStudent, setSelectedStudent] = useState<string>("");
	const [selectedClass, setSelectedClass] = useState<string>(""); // for entire class
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		async function fetchData() {
			// get current teacher id and assignments
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			
			// fetch teacher record
			const { data: teacherData } = await supabase
				.from("teachers")
				.select("id")
				.eq("user_id", user.id)
				.single();
			
			if (!teacherData) return;
			setTeacherId(teacherData.id);
			
			// fetch teacher assignments
			const { data: assignmentData } = await supabase
				.from("teacher_assignments")
				.select(`
					grade_id,
					section_id,
					grades (name),
					sections (name)
				`)
				.eq("teacher_id", teacherData.id);
			
			if (assignmentData) {
				const unique = Array.from(new Map(
					(assignmentData as any[]).map(item => {
						let gradeName = Array.isArray(item.grades)
							? item.grades[0]?.name
							: item.grades?.name;
						let sectionName = Array.isArray(item.sections)
							? item.sections[0]?.name
							: item.sections?.name;
						return [
							`${item.grade_id}-${item.section_id}`,
							{
								grade_id: item.grade_id,
								section_id: item.section_id,
								grade_name: gradeName,
								section_name: sectionName
							}
						];
					})
				).values());
				setAssignments(unique);
				
				// Create a set of assignment keys: "grade_id|section_id"
				const assignmentKeys = new Set(
					(assignmentData as any[]).map(item => `${item.grade_id}|${item.section_id}`)
				);
				
				// fetch teacher students without filtering by teacher_id
				const { data: studentData } = await supabase
					.from("school_students")
					.select(`
						id,
						user_id,
						roll_number,
						grade_id,
						section_id
					`);
				
				if (studentData && Array.isArray(studentData)) {
					// Filter only students whose grade and section match one of the teacher's assignments
					const filteredStudents = (studentData as any[]).filter(stu =>
						assignmentKeys.has(`${stu.grade_id}|${stu.section_id}`)
					);
					
					// For display purposes, fetch each student’s email from the users table
					const studentsWithEmail = await Promise.all(filteredStudents.map(async (stu: any) => {
						const { data: userData } = await supabase
							.from("users")
							.select("email")
							.eq("user_id", stu.user_id)
							.single();
						return {
							id: stu.id,
							email: userData?.email || "No email",
							grade_name: "", // you can enhance with lookup if necessary
							section_name: ""
						};
					}));
					setStudents(studentsWithEmail);
				}
			}
		}
		fetchData();
	}, [supabase]);

	async function handleSend() {
		if (!message) return;
		let insertData: any = {
			teacher_id: teacherId,
			message
		};
		if (announcementType === "class") {
			if (!selectedClass) return;
			const cls = JSON.parse(selectedClass);
			insertData = {
				...insertData,
				grade_id: cls.grade_id,
				section_id: cls.section_id,
				student_id: null
			};
		} else {
			// Ensure grade, section and student are selected
			if (!selectedGrade || !selectedSection || !selectedStudent) return;
			insertData = {
				...insertData,
				grade_id: selectedGrade,
				section_id: selectedSection,
				student_id: selectedStudent
			};
		}
		const { error } = await supabase
			.from("announcements")
			.insert(insertData);
		if (!error) {
			alert("Announcement sent!");
			setMessage("");
		} else {
			alert("Failed to send announcement.");
		}
	}

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
			<h2 className="text-lg font-medium text-gray-800 mb-4">Send Announcement</h2>

			{/* Replace radio buttons with shadcn Tabs */}
			<Tabs value={announcementType} onValueChange={(val) => setAnnouncementType(val as "class" | "student")}>
				<TabsList>
					<TabsTrigger value="class">Entire Class</TabsTrigger>
					<TabsTrigger value="student">Single Student</TabsTrigger>
				</TabsList>
				<TabsContent value="class">
					{/* Class announcement UI */}
					<div className="mb-4">
						<select
							value={selectedClass}
							onChange={(e) => setSelectedClass(e.target.value)}
							className="border rounded p-2 w-full"
						>
							<option value="">Select Class</option>
							{assignments.map((assignment) => (
								<option
									key={`${assignment.grade_id}-${assignment.section_id}`}
									value={JSON.stringify(assignment)}
								>
									{assignment.grade_name} - {assignment.section_name}
								</option>
							))}
						</select>
					</div>
				</TabsContent>
				<TabsContent value="student">
					{/* Single student announcement UI */}
					<div className="space-y-4">
						<div className="mb-4">
							<select
								value={selectedGrade}
								onChange={(e) => {
									setSelectedGrade(e.target.value);
									setSelectedSection(""); // reset section/student when grade changes
									setSelectedStudent("");
								}}
								className="border rounded p-2 w-full"
							>
								<option value="">Select Grade</option>
								{Array.from(new Map(
									assignments.map(a => [a.grade_id, { grade_id: a.grade_id, grade_name: a.grade_name }])
								).values()).map(item => (
									<option key={item.grade_id} value={item.grade_id}>
										{item.grade_name}
									</option>
								))}
							</select>
						</div>
						{selectedGrade && (
							<div className="mb-4">
								<select
									value={selectedSection}
									onChange={(e) => {
										setSelectedSection(e.target.value);
										setSelectedStudent("");
									}}
									className="border rounded p-2 w-full"
								>
									<option value="">Select Section</option>
									{Array.from(new Map(
										assignments
											.filter(a => a.grade_id === selectedGrade)
											.map(a => [a.section_id, { section_id: a.section_id, section_name: a.section_name }])
									).values()).map(item => (
										<option key={item.section_id} value={item.section_id}>
											{item.section_name}
										</option>
									))}
								</select>
							</div>
						)}
						{selectedGrade && selectedSection && (
							<div className="mb-4">
								<select
									value={selectedStudent}
									onChange={(e) => setSelectedStudent(e.target.value)}
									className="border rounded p-2 w-full"
								>
									<option value="">Select Student</option>
									{students.map(student => (
										<option key={student.id} value={student.id}>
											{student.email}
										</option>
									))}
								</select>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			<div className="mb-4">
				{/* Using shadcn Textarea component */}
				<Textarea
					placeholder="Enter announcement message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={3}
				/>
			</div>
			{/* Using shadcn Button component */}
			<Button onClick={handleSend}>
				Send Announcement
			</Button>
		</div>
	);
}
