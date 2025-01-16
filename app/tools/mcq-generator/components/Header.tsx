import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center space-x-2">
        <Link
          href="/tools"
          className="text-neutral-500 hover:text-neutral-700 mr-4"
        >
          <ChevronLeft />
        </Link>
        <h1 className="text-4xl font-bold text-rose-500">
          Assessment Generator
        </h1>
      </div>
    </header>
  );
}
