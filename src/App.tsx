import { Outlet } from "react-router-dom";
import Header from "./components/header";
import Footer from "./components/footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
