import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Calendar } from "lucide-react";
import AdminMembers from "./AdminMembers";
import AdminReports from "./AdminReports";
import AdminClasses from "./AdminClasses";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("members");

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin nadzorna plošča</h1>
            <p className="text-muted-foreground mt-1">Pozdravljen/a, {user?.fullName}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Člani
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vadbe
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Poročila
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <AdminMembers />
          </TabsContent>

          <TabsContent value="classes">
            <AdminClasses />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

