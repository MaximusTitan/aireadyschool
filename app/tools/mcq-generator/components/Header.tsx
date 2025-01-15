import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <Image
          src="/placeholder.svg"
          alt="Assessment Generator Logo"
          width={40}
          height={40}
          className="mr-4"
        />
        <h1 className="text-2xl font-bold text-gray-800">
          Assessment Generator
        </h1>
      </div>
    </header>
  );
}
