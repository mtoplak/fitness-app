import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutDashboard } from "lucide-react";
import AdminMembers from "./AdminMembers";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin nadzorna plošča</h1>
            <p className="text-muted-foreground mt-1">Pozdravljen/a, {user?.fullName}</p>
          </div>
          <Button variant="outline" onClick={logout}>Odjava</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Pregled
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Člani
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Dobrodošli v admin panelu</h2>
              <p className="text-muted-foreground">
                Tukaj lahko upravljate vse aspekte fitnes centra.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <AdminMembers />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}



