import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Mail, 
  MapPin, 
  Activity,
  CheckCircle,
  XCircle,
  Search,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MembershipStatus = "active" | "cancelled" | "expired";

type MembershipPackage = {
  _id: string;
  name: string;
  price: number;
};

type Membership = {
  _id: string;
  packageId: MembershipPackage;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  autoRenew: boolean;
};

type Member = {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  role: string;
  createdAt: string;
  currentMembership?: Membership;
  bookingsCount: number;
  upcomingBookings: number;
  membershipHistory?: Membership[];
};

type Statistics = {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  averageMembershipDays: number;
  newMembersLast30Days: number;
  newMembersPercentage: number;
};

type MemberDetails = {
  member: Member;
  membershipHistory: Membership[];
  bookings: Array<{
    _id: string;
    groupClassId?: { name: string };
    classDate: string;
    status: string;
  }>;
  statistics: {
    totalBookings: number;
    upcomingBookings: number;
  };
};

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/members");
      setMembers(response.members);
      setFilteredMembers(response.members);
      setStatistics(response.statistics);
    } catch (err) {
      console.error("Napaka pri nalaganju članov:", err);
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče naložiti seznama članov",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member =>
      member.fullName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.address?.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const loadMemberDetails = async (memberId: string) => {
    setDetailsLoading(true);
    try {
      const details = await api.get(`/admin/members/${memberId}`);
      setSelectedMember(details);
    } catch (err) {
      console.error("Napaka pri nalaganju podatkov člana:", err);
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče naložiti podatkov člana",
        variant: "destructive"
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const getMembershipStatusBadge = (status?: MembershipStatus) => {
    if (!status) {
      return <Badge variant="secondary">Brez članarine</Badge>;
    }

    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aktivna</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Preklicana</Badge>;
      case "expired":
        return <Badge variant="secondary">Potekla</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Nalaganje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pregled članov</h1>
        <p className="text-muted-foreground">
          Upravljanje in spremljanje vseh članov fitnes centra
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vsi člani</p>
                <p className="text-3xl font-bold">{statistics.totalMembers}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aktivne članarine</p>
                <p className="text-3xl font-bold text-green-600">{statistics.activeMembers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.inactiveMembers} neaktivnih
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Povprečna doba</p>
                <p className="text-3xl font-bold">{statistics.averageMembershipDays}</p>
                <p className="text-xs text-muted-foreground mt-1">dni članstva</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Novi člani (30 dni)</p>
                <p className="text-3xl font-bold text-orange-600">{statistics.newMembersLast30Days}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.newMembersPercentage}% vseh članov
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Iskanje po imenu, emailu ali naslovu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </Card>

      {/* Members Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ime in priimek</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status članarine</TableHead>
              <TableHead>Rezervacije</TableHead>
              <TableHead>Datum registracije</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Ni rezultatov iskanja" : "Ni članov"}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="font-medium">{member.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {member.role === "trainer" ? "Trener" : "Član"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {member.email}
                    </div>
                    {member.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {member.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getMembershipStatusBadge(member.currentMembership?.status)}
                    {member.currentMembership && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {member.currentMembership.packageId.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{member.bookingsCount}</span>
                    </div>
                    {member.upcomingBookings > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {member.upcomingBookings} prihodnjih
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadMemberDetails(member.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Podrobnosti
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podrobnosti člana</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-8 text-center text-muted-foreground">Nalaganje...</div>
          ) : selectedMember ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Osnovni podatki</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ime:</span> {selectedMember.member.fullName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {selectedMember.member.email}
                    </div>
                    {selectedMember.member.address && (
                      <div>
                        <span className="text-muted-foreground">Naslov:</span> {selectedMember.member.address}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Vloga:</span>{" "}
                      <Badge variant="outline">
                        {selectedMember.member.role === "trainer" ? "Trener" : "Član"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registriran:</span>{" "}
                      {formatDate(selectedMember.member.createdAt)}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Aktivnost</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Skupaj rezervacij:</span>{" "}
                      <span className="font-semibold">{selectedMember.statistics.totalBookings}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prihodnje rezervacije:</span>{" "}
                      <span className="font-semibold">{selectedMember.statistics.upcomingBookings}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Current Membership */}
              {selectedMember.member.currentMembership && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Trenutna članarina</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getMembershipStatusBadge(selectedMember.member.currentMembership.status)}
                      <span className="font-medium">
                        {selectedMember.member.currentMembership.packageId.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cena:</span>{" "}
                      {selectedMember.member.currentMembership.packageId.price}€/mesec
                    </div>
                    <div>
                      <span className="text-muted-foreground">Začetek:</span>{" "}
                      {formatShortDate(selectedMember.member.currentMembership.startDate)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Konec:</span>{" "}
                      {formatShortDate(selectedMember.member.currentMembership.endDate)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Samodejno podaljšanje:</span>{" "}
                      {selectedMember.member.currentMembership.autoRenew ? "Da" : "Ne"}
                    </div>
                  </div>
                </Card>
              )}

              {/* Membership History */}
              {selectedMember.membershipHistory.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Zgodovina članarin</h3>
                  <div className="space-y-2">
                    {selectedMember.membershipHistory.map((membership) => (
                      <div key={membership._id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div>
                          <div className="font-medium">{membership.packageId.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatShortDate(membership.startDate)} - {formatShortDate(membership.endDate)}
                          </div>
                        </div>
                        {getMembershipStatusBadge(membership.status)}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Bookings */}
              {selectedMember.bookings.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Zadnje rezervacije</h3>
                  <div className="space-y-2">
                    {selectedMember.bookings.slice(0, 10).map((booking) => (
                      <div key={booking._id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div>
                          <div className="font-medium">{booking.groupClassId?.name || "Osebni trening"}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatShortDate(booking.classDate)}
                          </div>
                        </div>
                        <Badge variant={booking.status === "cancelled" ? "destructive" : "outline"}>
                          {booking.status === "cancelled" ? "Preklicano" : "Potrjeno"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
