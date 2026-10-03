export default function Footer() {
  return (
    <footer className="border-t max-h-fit w-full text-center bottom-0 fixed">
      <div className="max-h-fit my-2">
        <p>
          made with 💕 by{" "}
          <a href="https://alexav.gg" target="_blank" className="underline">
            Alex
          </a>
          <span className="text-muted-foreground text-xs"> (and Claude)</span>
        </p>
        <p className="text-sm text-muted-foreground">
          <a
            href="https://github.com/azpha/flashcards"
            target="_blank"
            className="hover:underline"
          >
            source
          </a>{" "}
          -{" "}
          <a
            href="mailto:alex@alexav.gg"
            onClick={() => navigator.clipboard.writeText("alex@alexav.gg")}
            className="hover:underline"
          >
            alex@alexav.gg
          </a>
        </p>
      </div>
    </footer>
  );
}
