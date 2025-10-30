import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto py-12 px-4">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Članska nadzorna plošča</h1>
          <p className="mt-2">Pozdravljen/a, {user?.fullName}</p>
          <div className="mt-6">
            <Button variant="outline" onClick={logout}>Odjava</Button>
          </div>
        </div>
      </div>
    </section>
  );
}



