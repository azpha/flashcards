export type Card = {
  id: string;
  front: string;
  back: string;
  correct: number;
  incorrect: number;
  lastReviewed: number | null;
};

export type Deck = {
  id: string;
  name: string;
  description: string;
  cards: Card[];
  createdAt: number;
  lastStudied: number | null;
};

const STORAGE_KEY = "flashcards:decks";

const listeners = new Set<() => void>();
let decks: Deck[] = load();

function load(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Deck[];
  } catch {
    // fall through to sample data
  }
  return [sampleDeck()];
}

function commit(next: Deck[]) {
  decks = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // storage full or unavailable; keep in-memory state
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDecks() {
  return decks;
}

function uid() {
  return crypto.randomUUID();
}

function newCard(front: string, back: string): Card {
  return { id: uid(), front, back, correct: 0, incorrect: 0, lastReviewed: null };
}

function updateDeck(deckId: string, fn: (deck: Deck) => Deck) {
  commit(decks.map((d) => (d.id === deckId ? fn(d) : d)));
}

export function createDeck(name: string, description = ""): string {
  const deck: Deck = {
    id: uid(),
    name,
    description,
    cards: [],
    createdAt: Date.now(),
    lastStudied: null,
  };
  commit([deck, ...decks]);
  return deck.id;
}

export function renameDeck(deckId: string, name: string, description: string) {
  updateDeck(deckId, (d) => ({ ...d, name, description }));
}

export function deleteDeck(deckId: string) {
  commit(decks.filter((d) => d.id !== deckId));
}

export function addCard(deckId: string, front: string, back: string) {
  updateDeck(deckId, (d) => ({ ...d, cards: [...d.cards, newCard(front, back)] }));
}

export function updateCard(deckId: string, cardId: string, front: string, back: string) {
  updateDeck(deckId, (d) => ({
    ...d,
    cards: d.cards.map((c) => (c.id === cardId ? { ...c, front, back } : c)),
  }));
}

export function deleteCard(deckId: string, cardId: string) {
  updateDeck(deckId, (d) => ({ ...d, cards: d.cards.filter((c) => c.id !== cardId) }));
}

export function recordAnswer(deckId: string, cardId: string, gotIt: boolean) {
  const now = Date.now();
  updateDeck(deckId, (d) => ({
    ...d,
    lastStudied: now,
    cards: d.cards.map((c) =>
      c.id === cardId
        ? {
            ...c,
            correct: c.correct + (gotIt ? 1 : 0),
            incorrect: c.incorrect + (gotIt ? 0 : 1),
            lastReviewed: now,
          }
        : c,
    ),
  }));
}

export function resetProgress(deckId: string) {
  updateDeck(deckId, (d) => ({
    ...d,
    lastStudied: null,
    cards: d.cards.map((c) => ({ ...c, correct: 0, incorrect: 0, lastReviewed: null })),
  }));
}

/** Share of a card's answers that were correct, or null if never reviewed. */
export function cardAccuracy(card: Card): number | null {
  const total = card.correct + card.incorrect;
  return total === 0 ? null : card.correct / total;
}

function sampleDeck(): Deck {
  return {
    id: uid(),
    name: "World Capitals",
    description: "A starter deck to try things out",
    createdAt: Date.now(),
    lastStudied: null,
    cards: [
      newCard("France", "Paris"),
      newCard("Japan", "Tokyo"),
      newCard("Australia", "Canberra"),
      newCard("Canada", "Ottawa"),
      newCard("Brazil", "Brasília"),
      newCard("Kenya", "Nairobi"),
    ],
  };
}
