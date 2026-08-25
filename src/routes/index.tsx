import { createFileRoute } from "@tanstack/react-router";
import { GameView } from "@/components/game/GameView";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GameView />;
}
