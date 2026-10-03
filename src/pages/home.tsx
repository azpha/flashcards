import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Pencil, Plus } from "lucide-react";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Progress } from "#components/ui/progress";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#components/ui/card";
import { useDecks } from "#hooks/use-decks";
import { cardAccuracy, createDeck, type Deck } from "#lib/store";

function deckMastery(deck: Deck) {
  const reviewed = deck.cards.map(cardAccuracy).filter((a) => a !== null);
  if (deck.cards.length === 0) return 0;
  const sum = reviewed.reduce((acc, a) => acc + a, 0);
  return Math.round((sum / deck.cards.length) * 100);
}

function formatDate(ts: number | null) {
  if (!ts) return "Never studied";
  return `Studied ${new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export default function HomePage() {
  const decks = useDecks();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createDeck(trimmed);
    setName("");
    navigate(`/decks/${id}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your decks</h1>
          <p className="text-sm text-muted-foreground">
            {decks.length} {decks.length === 1 ? "deck" : "decks"} · {totalCards}{" "}
            {totalCards === 1 ? "card" : "cards"}
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2 sm:w-80">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New deck name"
            aria-label="New deck name"
          />
          <Button type="submit" disabled={!name.trim()}>
            <Plus />
            Create
          </Button>
        </form>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No decks yet. Create one above to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const mastery = deckMastery(deck);
            return (
              <Card key={deck.id}>
                <CardHeader>
                  <CardTitle className="truncate">
                    <Link to={`/decks/${deck.id}`} className="hover:underline">
                      {deck.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10">
                    {deck.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <div className="space-y-1.5 px-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                    </span>
                    <span>{mastery}% mastered</span>
                  </div>
                  <Progress value={mastery} />
                  <p className="text-xs text-muted-foreground">
                    {formatDate(deck.lastStudied)}
                  </p>
                </div>
                <CardFooter className="gap-2">
                  {deck.cards.length === 0 ? (
                    <Button className="flex-1" disabled>
                      <GraduationCap />
                      Study
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      render={<Link to={`/decks/${deck.id}/study`} />}
                      nativeButton={false}
                    >
                      <GraduationCap />
                      Study
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    render={<Link to={`/decks/${deck.id}`} />}
                    nativeButton={false}
                  >
                    <Pencil />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
