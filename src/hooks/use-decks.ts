import { useSyncExternalStore } from "react";
import { getDecks, subscribe } from "#lib/store";

export function useDecks() {
  return useSyncExternalStore(subscribe, getDecks);
}

export function useDeck(deckId: string | undefined) {
  const decks = useDecks();
  return decks.find((d) => d.id === deckId);
}
