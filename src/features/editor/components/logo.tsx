import Link from "next/link";
import Image from "next/image";

export const Logo = () => (
  <Link href="/">
    <div className="h-8 w-16 relative shrink-0">
      <Image
        src="/logo.svg"
        fill
        alt="Image AI"
        className="shrink-0 hover:opacity-75 transition"
      />
    </div>
  </Link>
);