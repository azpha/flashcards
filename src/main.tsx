import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import HomePage from "./pages/home.tsx";
import DeckPage from "./pages/deck.tsx";
import StudyPage from "./pages/study.tsx";
import "./assets/main.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "decks/:deckId", element: <DeckPage /> },
      { path: "decks/:deckId/study", element: <StudyPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
