import { Layers } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Layers className="size-5" />
          Flashcards
        </Link>
      </div>
    </header>
  );
}
