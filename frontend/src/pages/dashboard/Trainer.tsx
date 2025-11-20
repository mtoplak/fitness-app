import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import ClassParticipants from "./ClassParticipants";
import TrainerBookings from "./TrainerBookings";
import ClassManagement from "./ClassManagement";

export default function TrainerDashboard() {
  const { user, logout } = useAuth();
  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Trenerska nadzorna plošča</h1>
              <p className="mt-2 text-muted-foreground">Pozdravljen/a, {user?.fullName}</p>
            </div>
            <Button variant="outline" onClick={logout}>Odjava</Button>
          </div>
        </div>

        <div className="space-y-6">
          <ClassManagement />
          <TrainerBookings />
          <ClassParticipants />
        </div>
      </div>
    </section>
  );
}

