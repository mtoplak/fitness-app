import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Pencil, Trash2, RefreshCw, Calendar, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ClassStatus = "pending" | "approved" | "rejected";

type GroupClass = {
  _id: string;
  name: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  duration?: number;
  capacity?: number;
  status: ClassStatus;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  trainerUserId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  totalBookings?: number;
  createdAt: string;
};

type Statistics = {
  totalClasses: number;
  pendingClasses: number;
  approvedClasses: number;
  rejectedClasses: number;
};

const daysOfWeek = ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"];
const difficultyLabels = {
  easy: "Lahka",
  medium: "Srednja",
  hard: "Težka"
};

export default function AdminClasses() {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<GroupClass | null>(null);
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "edit" | "delete" | null>(null);
  const [comment, setComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ClassStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    difficulty: "medium",
    duration: 60,
    capacity: 20,
    status: "pending" as ClassStatus
  });

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/classes");
      setClasses(response.classes);
      setStatistics(response.statistics);
    } catch (err) {
      console.error("Napaka pri nalaganju vadb:", err);
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče naložiti vadb",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async () => {
    if (!selectedClass) return;
    
    try {
      await api.put(`/admin/classes/${selectedClass._id}/approve`, { comment });
      toast({
        title: "Uspešno",
        description: "Vadba je bila odobrena"
      });
      setActionDialog(null);
      setComment("");
      loadClasses();
    } catch (err) {
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče odobriti vadbe",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!selectedClass) return;
    
    try {
      await api.put(`/admin/classes/${selectedClass._id}/reject`, { comment });
      toast({
        title: "Uspešno",
        description: "Vadba je bila zavrnjena"
      });
      setActionDialog(null);
      setComment("");
      loadClasses();
    } catch (err) {
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče zavrniti vadbe",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedClass) return;
    
    try {
      await api.put(`/admin/classes/${selectedClass._id}`, editForm);
      toast({
        title: "Uspešno",
        description: "Vadba je bila posodobljena"
      });
      setActionDialog(null);
      loadClasses();
    } catch (err) {
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče posodobiti vadbe",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    
    try {
      await api.delete(`/admin/classes/${selectedClass._id}`);
      toast({
        title: "Uspešno",
        description: "Vadba je bila izbrisana"
      });
      setActionDialog(null);
      loadClasses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ni bilo mogoče izbrisati vadbe";
      toast({
        title: "Napaka",
        description: message,
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (cls: GroupClass) => {
    setSelectedClass(cls);
    setEditForm({
      name: cls.name,
      description: cls.description || "",
      difficulty: cls.difficulty || "medium",
      duration: cls.duration || 60,
      capacity: cls.capacity || 20,
      status: cls.status
    });
    setActionDialog("edit");
  };

  const filteredClasses = classes.filter(cls => {
    const matchesStatus = filterStatus === "all" || cls.status === filterStatus;
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.trainerUserId?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ClassStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Čaka na odobritev</Badge>;
      case "approved":
        return <Badge variant="default">Odobrena</Badge>;
      case "rejected":
        return <Badge variant="destructive">Zavrnjena</Badge>;
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upravljanje skupinskih vadb</h1>
        <p className="text-muted-foreground">
          Preglejte, odobrujte in urejajte skupinske vadbe
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Skupaj vadb</p>
                <p className="text-3xl font-bold">{statistics.totalClasses}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Čaka na odobritev</p>
                <p className="text-3xl font-bold">{statistics.pendingClasses}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Odobrene</p>
                <p className="text-3xl font-bold">{statistics.approvedClasses}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Zavrnjene</p>
                <p className="text-3xl font-bold">{statistics.rejectedClasses}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Iskanje</Label>
            <Input
              placeholder="Išči po imenu vadbe ali trenerju..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as "all" | ClassStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Vse</SelectItem>
                <SelectItem value="pending">Čaka na odobritev</SelectItem>
                <SelectItem value="approved">Odobrene</SelectItem>
                <SelectItem value="rejected">Zavrnjene</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadClasses} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Osveži
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vadba</TableHead>
              <TableHead>Trener</TableHead>
              <TableHead>Urnik</TableHead>
              <TableHead>Kapaciteta</TableHead>
              <TableHead>Rezervacije</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Ni vadb
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((cls) => (
                <TableRow key={cls._id}>
                  <TableCell>
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {cls.difficulty && difficultyLabels[cls.difficulty]} • {cls.duration || 60} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{cls.trainerUserId?.fullName || "Ni določeno"}</div>
                    <div className="text-sm text-muted-foreground">{cls.trainerUserId?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {cls.schedule.map((s, idx) => (
                        <div key={idx}>
                          {daysOfWeek[s.dayOfWeek]} {s.startTime}-{s.endTime}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {cls.capacity || "Ni določeno"}
                    </div>
                  </TableCell>
                  <TableCell>{cls.totalBookings || 0}</TableCell>
                  <TableCell>{getStatusBadge(cls.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {cls.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClass(cls);
                              setActionDialog("approve");
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Odobri
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClass(cls);
                              setActionDialog("reject");
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Zavrni
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(cls)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClass(cls);
                          setActionDialog("delete");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === "approve"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odobri vadbo</DialogTitle>
            <DialogDescription>
              Ali ste prepričani, da želite odobriti vadbo "{selectedClass?.name}"?
              Vadba bo postala vidna članom in na voljo za rezervacije.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Komentar za trenerja (neobvezno)</Label>
              <Textarea
                placeholder="Npr. Odlična vadba, odobrena brez pripomb..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Prekliči
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Odobri vadbo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === "reject"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zavrni vadbo</DialogTitle>
            <DialogDescription>
              Ali ste prepričani, da želite zavrniti vadbo "{selectedClass?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Razlog za zavrnitev (neobvezno)</Label>
              <Textarea
                placeholder="Npr. Prekrivanje urnika, manjkajoči podatki..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Prekliči
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Zavrni vadbo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={actionDialog === "edit"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uredi vadbo</DialogTitle>
            <DialogDescription>
              Spremenite podrobnosti vadbe
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Ime vadbe</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Opis</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Težavnost</Label>
                <Select
                  value={editForm.difficulty}
                  onValueChange={(val) => setEditForm({ ...editForm, difficulty: val as "easy" | "medium" | "hard" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Lahka</SelectItem>
                    <SelectItem value="medium">Srednja</SelectItem>
                    <SelectItem value="hard">Težka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trajanje (min)</Label>
                <Input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kapaciteta</Label>
                <Input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(val) => setEditForm({ ...editForm, status: val as ClassStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Čaka na odobritev</SelectItem>
                  <SelectItem value="approved">Odobrena</SelectItem>
                  <SelectItem value="rejected">Zavrnjena</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Prekliči
            </Button>
            <Button onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Shrani spremembe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={actionDialog === "delete"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Izbriši vadbo</DialogTitle>
            <DialogDescription>
              Ali ste prepričani, da želite izbrisati vadbo "{selectedClass?.name}"?
              To dejanje je nepovratno. Vadbe z obstoječimi rezervacijami ni mogoče izbrisati.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Prekliči
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Izbriši vadbo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
