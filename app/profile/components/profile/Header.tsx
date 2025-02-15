import Image from "next/image";
import Link from "next/link";
import newLogo from "@/public/newLogo.png";

const Header: React.FC = () => {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src={newLogo}
              alt="AI Ready School Logo"
              width={200}
              height={200}
              className="mb-4"
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {/* <Link href="#" className="text-gray-600 hover:text-gray-900">
            Challenges
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900">
            Browse Profiles
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900">
            Join the Club
          </Link> */}
        </nav>
      </div>
    </header>
  );
};

export default Header;
