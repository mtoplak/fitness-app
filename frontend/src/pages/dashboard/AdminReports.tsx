import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  Calendar,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type RevenueData = {
  period: { start: string; end: string };
  totalRevenue: number;
  subscriptionsByPackage: Array<{
    packageName: string;
    price: number;
    count: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    year: number;
    monthNumber: number;
    revenue: number;
    activeMemberships: number;
  }>;
  totalActiveMemberships: number;
};

type AttendanceData = {
  period: { start: string; end: string };
  summary: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    groupClassBookings: number;
    personalTrainingBookings: number;
    confirmedPersonalTraining: number;
    overallOccupancyRate: number;
  };
  groupClassAttendance: Array<{
    className: string;
    capacity: number;
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    occupancyRate: number;
    averageOccupancy: number;
  }>;
  dailyAttendance: Array<{
    date: string;
    totalBookings: number;
    confirmedBookings: number;
    groupClasses: number;
    personalTraining: number;
  }>;
  personalTraining: {
    total: number;
    confirmed: number;
    cancelled: number;
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminReports() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const loadReports = async () => {
    setLoading(true);
    try {
      const [revenue, attendance] = await Promise.all([
        api.get(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/reports/attendance?startDate=${startDate}&endDate=${endDate}`)
      ]);
      
      setRevenueData(revenue);
      setAttendanceData(attendance);
    } catch (err) {
      console.error("Napaka pri nalaganju poročil:", err);
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče naložiti poročil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}€`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && !revenueData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Poročila in analitika</h1>
        <p className="text-muted-foreground">
          Pregled zaslužka, prihodkov in udeležbe
        </p>
      </div>

      {/* Filter */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Začetni datum</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Končni datum</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadReports} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Nalaganje...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Osveži poročila
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Obdobje: {formatDate(startDate)} - {formatDate(endDate)}
        </div>
      </Card>

      {revenueData && attendanceData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Skupni prihodki</p>
                  <p className="text-3xl font-bold">{formatCurrency(revenueData.totalRevenue)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aktivne članarine</p>
                  <p className="text-3xl font-bold">{revenueData.totalActiveMemberships}</p>
                </div>
                <Users className="h-10 w-10 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Skupaj rezervacij</p>
                  <p className="text-3xl font-bold">{attendanceData.summary.totalBookings}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attendanceData.summary.confirmedBookings} potrjenih
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-purple-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Zapolnjenost vadb</p>
                  <p className="text-3xl font-bold">{attendanceData.summary.overallOccupancyRate}%</p>
                </div>
                <Activity className="h-10 w-10 text-orange-500 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Revenue Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Prihodki po mesecih</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}€`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Prihodki (€)" />
                <Line type="monotone" dataKey="activeMemberships" stroke="#82ca9d" name="Aktivne članarine" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Subscriptions by Package */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Naročnine po paketih</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueData.subscriptionsByPackage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ packageName, count }) => `${packageName}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {revenueData.subscriptionsByPackage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Prihodki po paketih</h2>
              <div className="space-y-3">
                {revenueData.subscriptionsByPackage.map((pkg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{pkg.packageName}</div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.count} naročnin × {formatCurrency(pkg.price)}
                      </div>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(pkg.revenue)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Group Classes Attendance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Udeležba po skupinskih vadbah</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData.groupClassAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="confirmedBookings" fill="#8884d8" name="Potrjene rezervacije" />
                <Bar dataKey="capacity" fill="#82ca9d" name="Kapaciteta" />
              </BarChart>
            </ResponsiveContainer>

            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Vadba</TableHead>
                  <TableHead>Kapaciteta</TableHead>
                  <TableHead>Rezervacije</TableHead>
                  <TableHead>Potrjene</TableHead>
                  <TableHead>Zapolnjenost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.groupClassAttendance.map((cls, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{cls.className}</TableCell>
                    <TableCell>{cls.capacity}</TableCell>
                    <TableCell>{cls.totalBookings}</TableCell>
                    <TableCell>{cls.confirmedBookings}</TableCell>
                    <TableCell>
                      <Badge variant={cls.occupancyRate >= 80 ? "default" : cls.occupancyRate >= 50 ? "secondary" : "outline"}>
                        {cls.occupancyRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Daily Attendance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dnevna udeležba</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData.dailyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })} />
                <YAxis />
                <Tooltip labelFormatter={(date) => formatDate(date)} />
                <Legend />
                <Line type="monotone" dataKey="groupClasses" stroke="#8884d8" name="Skupinske vadbe" />
                <Line type="monotone" dataKey="personalTraining" stroke="#82ca9d" name="Osebni treningi" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Personal Training Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Osebni treningi</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Skupaj rezervacij</div>
                <div className="text-2xl font-bold">{attendanceData.personalTraining.total}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Potrjene</div>
                <div className="text-2xl font-bold text-green-600">{attendanceData.personalTraining.confirmed}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Preklicane</div>
                <div className="text-2xl font-bold text-red-600">{attendanceData.personalTraining.cancelled}</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
