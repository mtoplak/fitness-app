import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarIcon, Clock, User, Euro, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sl } from "date-fns/locale";

interface Trainer {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  hourlyRate: number;
  trainerType: "personal" | "group" | "both";
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  displayTime: string;
}

export default function PersonalTrainingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  // Naloži trenerje
  useEffect(() => {
    async function fetchTrainers() {
      try {
        const data = await api.getTrainers();
        setTrainers(data);
      } catch (error) {
        toast({
          title: "Napaka",
          description: "Napaka pri nalaganju trenerjev",
          variant: "destructive"
        });
      } finally {
        setLoadingTrainers(false);
      }
    }
    fetchTrainers();
  }, [toast]);

  // Naloži razpoložljive termine ko se izbere trener ali datum
  useEffect(() => {
    if (!selectedTrainer || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    async function fetchAvailability() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      
      try {
        const dateStr = formatDateToYYYYMMDD(selectedDate);
        const data = await api.getTrainerAvailability(selectedTrainer.id, dateStr);
        setAvailableSlots(data.slots);
      } catch (error) {
        toast({
          title: "Napaka",
          description: "Napaka pri nalaganju razpoložljivosti",
          variant: "destructive"
        });
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [selectedTrainer, selectedDate, toast]);

  function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function handleBooking() {
    if (!selectedTrainer || !selectedSlot) return;

    setBooking(true);
    try {
      await api.bookPersonalTraining(selectedTrainer.id, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes
      });

      toast({
        title: "Uspešno rezervirano!",
        description: `Osebni trening z ${selectedTrainer.fullName} je bil uspešno rezerviran.`
      });

      setSelectedSlot(null);
      setNotes("");
      
      if (selectedDate) {
        const dateStr = formatDateToYYYYMMDD(selectedDate);
        const data = await api.getTrainerAvailability(selectedTrainer.id, dateStr);
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Prišlo je do napake";
      toast({
        title: "Napaka pri rezervaciji",
        description: message,
        variant: "destructive"
      });
    } finally {
      setBooking(false);
    }
  }

  if (loadingTrainers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Nazaj
        </Button>
        <h1 className="text-3xl font-bold mb-2">Rezervacija osebnega treninga</h1>
        <p className="text-gray-600">Izberite trenerja, datum in čas vašega osebnega treninga</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Korak 1: Izbira trenerja */}
        <Card className={selectedTrainer ? "border-purple-200" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              1. Izberite trenerja
            </CardTitle>
            <CardDescription>Kliknite na trenerja za izbiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                onClick={() => setSelectedTrainer(trainer)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTrainer?.id === trainer.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{trainer.fullName}</h3>
                  {selectedTrainer?.id === trainer.id && (
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Euro className="h-4 w-4" />
                  <span>{trainer.hourlyRate}€/uro</span>
                </div>
              </div>
            ))}
            {trainers.length === 0 && (
              <p className="text-center text-gray-500 py-4">Ni razpoložljivih trenerjev</p>
            )}
          </CardContent>
        </Card>

        {/* Korak 2: Izbira datuma in časa */}
        <Card className={selectedDate && selectedSlot ? "border-purple-200" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              2. Izberite datum
            </CardTitle>
            <CardDescription>
              {selectedTrainer ? `Izberite datum za ${selectedTrainer.fullName}` : "Najprej izberite trenerja"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrainer ? (
              <div className="space-y-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={sl}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />

                {selectedDate && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Razpoložljivi termini
                    </h4>
                    {loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map((slot, index) => (
                          <Button
                            key={index}
                            variant={selectedSlot === slot ? "default" : "outline"}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`h-auto py-2 ${
                              selectedSlot === slot
                                ? "bg-purple-600 hover:bg-purple-700"
                                : !slot.available
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="text-center w-full">
                              <div className="text-xs">{slot.displayTime}</div>
                              {!slot.available && (
                                <div className="text-[10px] text-gray-500">Zasedeno</div>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Najprej izberite trenerja</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Korak 3: Potrditev in opombe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              3. Potrditev rezervacije
            </CardTitle>
            <CardDescription>Preverite podatke in potrdite</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrainer && selectedDate && selectedSlot ? (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                  <div>
                    <Label className="text-xs text-gray-600">Trener</Label>
                    <p className="font-semibold">{selectedTrainer.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Datum</Label>
                    <p className="font-semibold">
                      {selectedDate.toLocaleDateString("sl-SI", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Čas</Label>
                    <p className="font-semibold">{selectedSlot.displayTime}</p>
                  </div>
                  <div className="border-t pt-2">
                    <Label className="text-xs text-gray-600">Cena</Label>
                    <p className="font-bold text-lg text-purple-600">
                      {selectedTrainer.hourlyRate}€
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Opombe (opcijsko)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dodajte morebitne opombe za trenerja..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {booking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rezerviram...
                    </>
                  ) : (
                    "Potrdi rezervacijo"
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Izberite trenerja, datum in čas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
