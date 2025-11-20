import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Mail, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WeeklyTimeSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type GroupClass = {
  _id: string;
  name: string;
  capacity?: number;
  schedule: WeeklyTimeSlot[];
};

type ClassInstance = {
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity?: number;
};

type Participant = {
  id: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email: string;
  };
  bookedAt: string;
};

type ParticipantsData = {
  className: string;
  classDate: string;
  capacity: number;
  totalParticipants: number;
  availableSpots: number;
  participants: Participant[];
};

export default function ClassParticipants() {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [classInstances, setClassInstances] = useState<ClassInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [participantsData, setParticipantsData] = useState<ParticipantsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generiraj instance vadb za naslednja 2 tedna
  const generateClassInstances = (classes: GroupClass[]): ClassInstance[] => {
    const instances: ClassInstance[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    for (const cls of classes) {
      for (const slot of cls.schedule || []) {
        // Najdi vse datume za ta dan v tednu v naslednjih 2 tednih
        const currentDate = new Date(today);
        
        // Pomakni na prvi pojav tega dne v tednu
        while (currentDate.getDay() !== slot.dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (currentDate > twoWeeksFromNow) break;
        }

        // Dodaj vse pojave tega termina v naslednjih 2 tednih
        while (currentDate <= twoWeeksFromNow) {
          const dateStr = currentDate.toISOString().split('T')[0];
          instances.push({
            classId: cls._id,
            className: cls.name,
            date: dateStr,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: cls.capacity
          });
          
          // Pomakni na naslednji teden
          currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    }

    // Sortiraj po datumu in času
    instances.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    return instances;
  };

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data as GroupClass[]);
      const instances = generateClassInstances(data as GroupClass[]);
      setClassInstances(instances);
      
      // Avtomatsko izberi prvi termin
      if (instances.length > 0) {
        const firstKey = `${instances[0].classId}|${instances[0].date}`;
        setSelectedInstance(firstKey);
      }
    } catch (err) {
      console.error("Napaka pri nalaganju vadb:", err);
      toast({
        title: "Napaka",
        description: "Ni bilo mogoče naložiti seznama vadb",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avtomatsko naloži udeležence, ko se izbere termin
  useEffect(() => {
    if (selectedInstance) {
      loadParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstance]);

  const loadParticipants = async () => {
    if (!selectedInstance) {
      return;
    }

    const [classId, date] = selectedInstance.split('|');
    
    setLoading(true);
    setError(null);

    try {
      const data = await api.getClassParticipants(classId, date);
      setParticipantsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Napaka pri nalaganju udeležencev";
      setError(errorMessage);
      setParticipantsData(null);
      toast({
        title: "Napaka",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatInstanceLabel = (instance: ClassInstance): string => {
    const date = new Date(instance.date + 'T12:00:00');
    const dayNames = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
    const dayName = dayNames[instance.dayOfWeek];
    const dateStr = date.toLocaleDateString('sl-SI', { day: 'numeric', month: 'numeric' });
    
    return `${instance.className} - ${dayName} ${dateStr} ob ${instance.startTime}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('sl-SI', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Udeleženci vadb</h1>
        <p className="text-muted-foreground">
          Pregled prijavljenih udeležencev za posamezno vadbo
        </p>
      </div>

      {/* Filter card */}
      <Card className="p-6">
        <div className="space-y-2">
          <Label htmlFor="class-instance-select">Izberi termin vadbe</Label>
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger id="class-instance-select">
              <SelectValue placeholder="Izberi termin vadbe" />
            </SelectTrigger>
            <SelectContent>
              {classInstances.map((instance) => {
                const key = `${instance.classId}|${instance.date}`;
                return (
                  <SelectItem key={key} value={key}>
                    {formatInstanceLabel(instance)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {loading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Nalaganje udeležencev...
            </p>
          )}
        </div>
      </Card>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Participants data */}
      {participantsData && (
        <div className="space-y-4">
          {/* Summary card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{participantsData.className}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={loadParticipants}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Osveži
              </Button>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(participantsData.classDate)}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Kapaciteta</div>
                <div className="text-2xl font-bold">{participantsData.capacity}</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Prijavljeni</div>
                <div className="text-2xl font-bold text-primary">{participantsData.totalParticipants}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Prosta mesta</div>
                <div className="text-2xl font-bold">
                  {participantsData.availableSpots}
                </div>
              </div>
            </div>

            {participantsData.availableSpots === 0 && (
              <Badge variant="destructive" className="mt-4">
                Vadba je polno zasedena
              </Badge>
            )}
          </Card>

          {/* Participants list */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seznam udeležencev ({participantsData.totalParticipants})
            </h3>

            {participantsData.participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ni prijavljenih udeležencev za to vadbo.
              </div>
            ) : (
              <div className="space-y-3">
                {participantsData.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{participant.user.fullName}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {participant.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Rezervirano: {formatTime(participant.bookedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Initial state */}
      {!participantsData && !error && !loading && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Izberi vadbo in datum za prikaz udeležencev</p>
          </div>
        </Card>
      )}
    </div>
  );
}
