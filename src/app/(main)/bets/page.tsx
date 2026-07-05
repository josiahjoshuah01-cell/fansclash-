import { MyBetsList } from "@/components/my-bets-list";

export default function BetsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My bets</h1>
        <p className="mt-1 text-muted-foreground">
          Track open matching, locked stakes, and settled outcomes.
        </p>
      </div>

      <MyBetsList />
    </div>
  );
}
