import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Textarea } from "#components/ui/textarea";
import { Badge } from "#components/ui/badge";
import ConfirmDialog from "#components/confirm-dialog";
import { useDeck } from "#hooks/use-decks";
import {
  addCard,
  cardAccuracy,
  deleteCard,
  deleteDeck,
  renameDeck,
  resetProgress,
  updateCard,
  type Card,
} from "#lib/store";

/** Submit the surrounding form on Ctrl/Cmd+Enter from inside a textarea. */
function submitOnModEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }
}

type CardFormProps = {
  initialFront?: string;
  initialBack?: string;
  submitLabel: string;
  onSubmit: (front: string, back: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

function CardForm({
  initialFront = "",
  initialBack = "",
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: CardFormProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const valid = front.trim() !== "" && back.trim() !== "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    onSubmit(front.trim(), back.trim());
    if (!onCancel) {
      setFront("");
      setBack("");
      e.currentTarget.querySelector("textarea")?.focus();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === "Escape" && onCancel?.()}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Front</span>
          <Textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onKeyDown={submitOnModEnter}
            placeholder="Question or term"
            autoFocus={autoFocus}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Back</span>
          <Textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            onKeyDown={submitOnModEnter}
            placeholder="Answer or definition"
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-xs text-muted-foreground sm:inline">
          Ctrl + Enter to save
        </span>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!valid}>
          {onCancel ? <Check /> : <Plus />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function CardRow({ deckId, card, index }: { deckId: string; card: Card; index: number }) {
  const [editing, setEditing] = useState(false);
  const accuracy = cardAccuracy(card);

  if (editing) {
    return (
      <li className="rounded-xl bg-card p-4 ring-1 ring-ring/60">
        <CardForm
          initialFront={card.front}
          initialBack={card.back}
          submitLabel="Save"
          autoFocus
          onSubmit={(front, back) => {
            updateCard(deckId, card.id, front, back);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="group flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <span className="w-6 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
        {index + 1}
      </span>
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 sm:gap-6">
        <p className="text-sm break-words whitespace-pre-wrap">{card.front}</p>
        <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
          {card.back}
        </p>
      </div>
      <div className="flex w-28 shrink-0 items-start justify-end gap-1">
        {accuracy !== null && (
          <Badge variant="secondary" className="mr-1 tabular-nums">
            {Math.round(accuracy * 100)}%
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit card"
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete card"
          onClick={() => deleteCard(deckId, card.id)}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

export default function DeckPage() {
  const { deckId } = useParams();
  const deck = useDeck(deckId);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  if (!deck) return <Navigate to="/" replace />;

  const q = query.trim().toLowerCase();
  const visible = deck.cards
    .map((card, index) => ({ card, index }))
    .filter(
      ({ card }) =>
        !q || card.front.toLowerCase().includes(q) || card.back.toLowerCase().includes(q),
    );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link to="/" />}
          nativeButton={false}
        >
          <ArrowLeft />
          All decks
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <input
              key={`name-${deck.id}`}
              defaultValue={deck.name}
              aria-label="Deck name"
              className="w-full rounded-md bg-transparent px-1 -mx-1 text-2xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name) renameDeck(deck.id, name, deck.description);
                else e.target.value = deck.name;
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <input
              key={`desc-${deck.id}`}
              defaultValue={deck.description}
              placeholder="Add a description…"
              aria-label="Deck description"
              className="w-full rounded-md bg-transparent px-1 -mx-1 text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/50"
              onBlur={(e) => renameDeck(deck.id, deck.name, e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {deck.cards.length === 0 ? (
              <Button disabled>
                <GraduationCap />
                Study
              </Button>
            ) : (
              <Button render={<Link to={`/decks/${deck.id}/study`} />} nativeButton={false}>
                <GraduationCap />
                Study {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
              </Button>
            )}
            <ConfirmDialog
              trigger={
                <Button variant="outline" aria-label="Reset progress">
                  <RotateCcw />
                </Button>
              }
              title="Reset progress?"
              description="This clears the study history for every card in this deck."
              confirmLabel="Reset"
              onConfirm={() => resetProgress(deck.id)}
            />
            <ConfirmDialog
              trigger={
                <Button variant="destructive" aria-label="Delete deck">
                  <Trash2 />
                </Button>
              }
              title={`Delete "${deck.name}"?`}
              description={`This permanently deletes the deck and its ${deck.cards.length} cards.`}
              onConfirm={() => {
                navigate("/");
                deleteDeck(deck.id);
              }}
            />
          </div>
        </div>
      </div>

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium">Add a card</h2>
        <CardForm
          submitLabel="Add card"
          autoFocus={deck.cards.length === 0}
          onSubmit={(front, back) => addCard(deck.id, front, back)}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">
            Cards <span className="text-muted-foreground">({deck.cards.length})</span>
          </h2>
          {deck.cards.length > 0 && (
            <div className="relative w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards"
                aria-label="Search cards"
                className="pl-8"
              />
            </div>
          )}
        </div>

        {deck.cards.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            This deck is empty. Add your first card above.
          </p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No cards match “{query}”.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map(({ card, index }) => (
              <CardRow key={card.id} deckId={deck.id} card={card} index={index} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
