import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./dashboard/Admin";
import TrainerDashboard from "./dashboard/Trainer";
import MemberDashboard from "./dashboard/Member";

export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "trainer") return <TrainerDashboard />;
  return <MemberDashboard />;
}

