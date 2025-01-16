import { ChatHistory } from "../components/chat-history";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="flex flex-col px-6">
      <Link
        href="/tools/research"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 mt-4 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Chat History</h1>
      <ChatHistory />
    </div>
  );
}
