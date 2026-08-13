import { PresaleManager } from "@/features/presale/components/PresaleManager";

export default function AdminPresalePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Presale Manager</h1>
        <p className="text-sm text-muted-foreground">
          Manage SPINE presale: monitor sales, withdraw SOL, finalize.
        </p>
      </div>
      <PresaleManager />
    </div>
  );
}
