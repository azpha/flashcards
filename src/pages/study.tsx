import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Repeat, RotateCcw, Shuffle, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "#components/ui/button";
import { Progress } from "#components/ui/progress";
import { useDeck } from "#hooks/use-decks";
import { recordAnswer, type Card } from "#lib/store";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type Session = {
  /** Card ids still to answer correctly; the head is the current card. */
  queue: string[];
  total: number;
  /** Whether each card was answered correctly on its first attempt this session. */
  firstTry: Record<string, boolean>;
};

function startSession(cardIds: string[], shuffled: boolean): Session {
  return {
    queue: shuffled ? shuffle(cardIds) : cardIds,
    total: cardIds.length,
    firstTry: {},
  };
}

export default function StudyPage() {
  const { deckId } = useParams();
  const deck = useDeck(deckId);

  const [shuffled, setShuffled] = useState(true);
  const [reversed, setReversed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState<Session>(() =>
    startSession(deck?.cards.map((c) => c.id) ?? [], true),
  );

  const cardsById = new Map<string, Card>(deck?.cards.map((c) => [c.id, c]));
  // Drop cards that were deleted mid-session.
  const queue = session.queue.filter((id) => cardsById.has(id));
  const current = queue.length > 0 ? cardsById.get(queue[0])! : null;
  const mastered = session.total - queue.length;

  const answer = useCallback(
    (gotIt: boolean) => {
      if (!deck || !current) return;
      recordAnswer(deck.id, current.id, gotIt);
      setFlipped(false);
      setSession((s) => {
        const [head, ...rest] = s.queue;
        return {
          ...s,
          queue: gotIt ? rest : [...rest, head],
          firstTry: head in s.firstTry ? s.firstTry : { ...s.firstTry, [head]: gotIt },
        };
      });
    },
    [deck, current],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("button, input, textarea")) {
        if (e.key === " " || e.key === "Enter") return;
      }
      if (!current) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === "1" || e.key === "ArrowLeft")) {
        answer(false);
      } else if (flipped && (e.key === "2" || e.key === "ArrowRight")) {
        answer(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, flipped, answer]);

  if (!deck) return <Navigate to="/" replace />;

  function restart(ids: string[], shuffle = shuffled) {
    setFlipped(false);
    setSession(startSession(ids, shuffle));
  }

  const allIds = deck.cards.map((c) => c.id);
  const missedIds = Object.entries(session.firstTry)
    .filter(([id, ok]) => !ok && cardsById.has(id))
    .map(([id]) => id);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link to={`/decks/${deck.id}`} />}
        nativeButton={false}
      >
        <ArrowLeft />
        {deck.name}
      </Button>
      <div className="flex gap-1">
        <Button
          variant={shuffled ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={shuffled}
          onClick={() => {
            setShuffled(!shuffled);
            restart(allIds, !shuffled);
          }}
        >
          <Shuffle />
          Shuffle
        </Button>
        <Button
          variant={reversed ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={reversed}
          onClick={() => {
            setReversed(!reversed);
            setFlipped(false);
          }}
        >
          <Repeat />
          Back first
        </Button>
      </div>
    </div>
  );

  if (!current) {
    const answered = Object.values(session.firstTry);
    const firstTryCorrect = answered.filter(Boolean).length;
    const pct = answered.length ? Math.round((firstTryCorrect / answered.length) * 100) : 0;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {header}
        <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-foreground/10">
          <p className="text-5xl font-semibold tabular-nums">{pct}%</p>
          <p className="mt-2 text-muted-foreground">
            {firstTryCorrect} of {answered.length} right on the first try
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {missedIds.length > 0 && (
              <Button onClick={() => restart(missedIds)}>
                <RotateCcw />
                Review {missedIds.length} missed
              </Button>
            )}
            <Button
              variant={missedIds.length > 0 ? "outline" : "default"}
              onClick={() => restart(allIds)}
            >
              <RotateCcw />
              Study all again
            </Button>
            <Button variant="ghost" render={<Link to="/" />} nativeButton={false}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const prompt = reversed ? current.back : current.front;
  const solution = reversed ? current.front : current.back;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {header}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            {mastered} / {session.total} learned
          </span>
          {queue.length > 0 && <span>{queue.length} remaining</span>}
        </div>
        <Progress value={(mastered / session.total) * 100} />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show front" : "Show answer"}
        className="block aspect-[3/2] w-full perspective-[1200px] outline-none focus-visible:[&>div]:ring-3 focus-visible:[&>div]:ring-ring/50 rounded-2xl"
      >
        {/* Keyed per card so the next card mounts face-up instead of animating back and leaking its answer. */}
        <div
          key={current.id}
          className={cn(
            "relative size-full rounded-2xl transition-transform duration-500 transform-3d",
            flipped && "rotate-y-180",
          )}
        >
          <CardFace label={reversed ? "Back" : "Front"} text={prompt} />
          <CardFace label={reversed ? "Front" : "Back"} text={solution} back />
        </div>
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="destructive"
            size="lg"
            className="h-12 text-base"
            onClick={() => answer(false)}
          >
            <X />
            Still learning
            <Kbd>1</Kbd>
          </Button>
          <Button size="lg" className="h-12 text-base" onClick={() => answer(true)}>
            <Check />
            Got it
            <Kbd>2</Kbd>
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="lg"
          className="h-12 w-full text-base"
          onClick={() => setFlipped(true)}
        >
          Show answer
          <Kbd>Space</Kbd>
        </Button>
      )}
    </div>
  );
}

function CardFace({ label, text, back }: { label: string; text: string; back?: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10 backface-hidden",
        back && "rotate-y-180 bg-secondary",
      )}
    >
      <span className="text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex flex-1 items-center justify-center overflow-auto">
        <p className="text-center text-2xl font-medium break-words whitespace-pre-wrap sm:text-3xl">
          {text}
        </p>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1 hidden rounded border border-current/20 px-1.5 py-0.5 font-sans text-[0.7rem] opacity-60 sm:inline">
      {children}
    </kbd>
  );
}
