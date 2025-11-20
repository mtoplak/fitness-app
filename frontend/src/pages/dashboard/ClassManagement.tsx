import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupClass {
  _id: string;
  name: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  duration?: number;
  capacity?: number;
  status?: "pending" | "approved" | "rejected";
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const dayNames = ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"];
const difficultyLabels = {
  easy: "Začetnik",
  medium: "Srednje",
  hard: "Napredni"
};

const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800"
};

export default function ClassManagement() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GroupClass | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [formDuration, setFormDuration] = useState(60);
  const [formCapacity, setFormCapacity] = useState(20);
  const [formSchedule, setFormSchedule] = useState<TimeSlot[]>([]);

  async function fetchClasses() {
    setLoading(true);
    try {
      const data = await api.getMyClasses();
      setClasses(data.classes);
    } catch (error) {
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju vadb",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreateDialog() {
    setEditingClass(null);
    setFormName("");
    setFormDescription("");
    setFormDifficulty("medium");
    setFormDuration(60);
    setFormCapacity(20);
    setFormSchedule([{ dayOfWeek: 1, startTime: "18:00", endTime: "19:00" }]);
    setDialogOpen(true);
  }

  function openEditDialog(classData: GroupClass) {
    setEditingClass(classData);
    setFormName(classData.name);
    setFormDescription(classData.description || "");
    setFormDifficulty(classData.difficulty || "medium");
    setFormDuration(classData.duration || 60);
    setFormCapacity(classData.capacity || 20);
    setFormSchedule(classData.schedule);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formName || formSchedule.length === 0) {
      toast({
        title: "Napaka",
        description: "Ime vadbe in urnik sta obvezna",
        variant: "destructive"
      });
      return;
    }

    if (submitting) return; // Prepreči dvojni submit

    setSubmitting(true);
    try {
      if (editingClass) {
        await api.updateClass(editingClass._id, {
          name: formName,
          description: formDescription,
          difficulty: formDifficulty,
          duration: formDuration,
          capacity: formCapacity,
          schedule: formSchedule
        });
        toast({
          title: "Uspešno posodobljeno",
          description: "Vadba je bila uspešno posodobljena"
        });
      } else {
        await api.createClass({
          name: formName,
          description: formDescription,
          difficulty: formDifficulty,
          duration: formDuration,
          capacity: formCapacity,
          schedule: formSchedule
        });
        toast({
          title: "Uspešno ustvarjeno",
          description: "Nova vadba poslana na odobritev administratorju"
        });
      }
      
      setDialogOpen(false);
      fetchClasses();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Prišlo je do napake";
      toast({
        title: "Napaka",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(classId: string) {
    if (!confirm("Ali ste prepričani, da želite izbrisati to vadbo?")) {
      return;
    }

    try {
      await api.deleteClass(classId);
      toast({
        title: "Uspešno izbrisano",
        description: "Vadba je bila uspešno izbrisana"
      });
      fetchClasses();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Prišlo je do napake";
      toast({
        title: "Napaka",
        description: message,
        variant: "destructive"
      });
    }
  }

  function addTimeSlot() {
    setFormSchedule([...formSchedule, { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" }]);
  }

  function removeTimeSlot(index: number) {
    setFormSchedule(formSchedule.filter((_, i) => i !== index));
  }

  function updateTimeSlot(index: number, field: keyof TimeSlot, value: string | number) {
    const updated = [...formSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setFormSchedule(updated);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upravljanje z vadbami</CardTitle>
            <CardDescription>Dodajte nove vadbe ali uredite obstoječe</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova vadba
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClass ? "Uredi vadbo" : "Nova vadba"}</DialogTitle>
                <DialogDescription>
                  {editingClass ? "Posodobite podatke o vadbi" : "Dodajte novo skupinsko vadbo"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Ime vadbe *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="npr. Joga za začetnike"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Kratek opis vadbe..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Zahtevnost</Label>
                    <Select value={formDifficulty} onValueChange={(v) => setFormDifficulty(v as "easy" | "medium" | "hard")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Začetnik</SelectItem>
                        <SelectItem value="medium">Srednje</SelectItem>
                        <SelectItem value="hard">Napredni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Trajanje (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      min={15}
                      max={180}
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity">Kapaciteta</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Urnik *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                      <Plus className="h-3 w-3 mr-1" />
                      Dodaj termin
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formSchedule.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Select
                          value={slot.dayOfWeek.toString()}
                          onValueChange={(v) => updateTimeSlot(index, "dayOfWeek", Number(v))}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dayNames.map((day, idx) => (
                              <SelectItem key={idx} value={idx.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                          className="w-[120px]"
                        />

                        <span>-</span>

                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                          className="w-[120px]"
                        />

                        {formSchedule.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                    Prekliči
                  </Button>
                  <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingClass ? "Posodabljanje..." : "Ustvarjanje..."}
                      </>
                    ) : (
                      editingClass ? "Posodobi" : "Ustvari"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nimate še nobene vadbe</p>
            <p className="text-sm">Kliknite "Nova vadba" za dodajanje</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((classData) => (
              <div key={classData._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{classData.name}</h3>
                    {classData.description && (
                      <p className="text-sm text-gray-600 mt-1">{classData.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(classData)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(classData._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {classData.status && (
                    <Badge 
                      variant={classData.status === "approved" ? "default" : classData.status === "pending" ? "secondary" : "destructive"}
                    >
                      {classData.status === "pending" && "⏳ Čaka na odobritev"}
                      {classData.status === "approved" && "✅ Odobrena"}
                      {classData.status === "rejected" && "❌ Zavrnjena"}
                    </Badge>
                  )}
                  {classData.difficulty && (
                    <Badge className={difficultyColors[classData.difficulty]}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {difficultyLabels[classData.difficulty]}
                    </Badge>
                  )}
                  {classData.duration && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {classData.duration} min
                    </Badge>
                  )}
                  {classData.capacity && (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {classData.capacity} mest
                    </Badge>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Urnik:</p>
                  <div className="space-y-1">
                    {classData.schedule.map((slot, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{dayNames[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
