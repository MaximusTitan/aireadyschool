"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  timestamp: string;
  read: boolean;
  document_id?: string; // Add document_id field
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Fetch notifications from DB on mount
  useEffect(() => {
    async function fetchNotifications() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("timestamp", { ascending: false });
      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    }
    fetchNotifications();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Subscribe to document submissions
    const channel = supabase
      .channel("document-submissions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "document_generator",
          filter: "submitted=eq.true",
        },
        (payload) => {
          const newNotification = {
            id: payload.new.id,
            title: `New submission: ${payload.new.title}`,
            timestamp: new Date().toISOString(),
            read: false,
            document_id: payload.new.id, // Store document ID for navigation
          };
          // Insert notification into DB using an async function and array format for the record
          (async () => {
            const { error } = await supabase
              .from("notifications")
              .insert([newNotification]);
            if (error) {
              console.error("Error inserting notification:", error);
            }
          })();
          // Update local state
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((count) => count + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification.id);

    // Navigate to document generator with ID if available
    if (notification.document_id) {
      setIsOpen(false); // Close notification panel
      router.push(`/tools/document-generator?id=${notification.document_id}`);
    }
  };

  const markAsRead = async (id: string) => {
    // Update notification in DB
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    // Update local state
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
