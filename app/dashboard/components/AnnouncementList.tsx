import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Announcement {
  id: string;
  created_at: string;
  teacher_id: string;
  grade_id: string | null;
  section_id: string | null;
  student_id: string | null;
  message: string;
}

interface AnnouncementListProps {
  student: {
    id: string;
    grade_id: string;
    section_id: string;
  };
}

export default function AnnouncementList({ student }: AnnouncementListProps) {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Function to fetch initial announcements
    async function fetchAnnouncements() {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        // Using PostgREST OR filter: show announcements sent directly to student OR class announcements (student_id is null)
        .or(`student_id.eq.${student.id},and(grade_id.eq.${student.grade_id},section_id.eq.${student.section_id},student_id.is.null)`);
      if (data) {
        setAnnouncements(data as Announcement[]);
      }
    }
    fetchAnnouncements();

    // Subscribe to realtime INSERT events using supabase.channel
    const channel = supabase
      .channel("realtime_announcements")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload: any) => { // payload typed explicitly as any
          const newAnnouncement = payload.new as Announcement;
          if (
            newAnnouncement.student_id === student.id ||
            (!newAnnouncement.student_id &&
              newAnnouncement.grade_id === student.grade_id &&
              newAnnouncement.section_id === student.section_id)
          ) {
            setAnnouncements((prev) => [newAnnouncement, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student, supabase]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Announcements</h2>
      {announcements.length === 0 ? (
        <p className="text-gray-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="border p-3 rounded">
              <p className="text-gray-700">{announcement.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(announcement.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
