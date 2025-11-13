import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainerBooking {
  id: string;
  client: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  notes: string;
  status: string;
  createdAt: string;
}

export default function TrainerBookings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "all">("upcoming");
  const [bookings, setBookings] = useState<TrainerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBookings() {
    setLoading(true);
    try {
      const data = await api.getMyTrainerBookings(activeTab === "upcoming");
      setBookings(data.bookings);
    } catch (error) {
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju rezervacij",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("sl-SI", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      time: date.toLocaleTimeString("sl-SI", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };
  }

  function formatDuration(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}min` : ""}`;
    }
    return `${minutes}min`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rezervacije osebnih treningov</CardTitle>
        <CardDescription>Pregled rezervacij strank za osebne treninge</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upcoming" | "all")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">Prihajajoče</TabsTrigger>
            <TabsTrigger value="all">Vse</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ni prihajajočih rezervacij</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const startDateTime = formatDateTime(booking.startTime);
                  const endDateTime = formatDateTime(booking.endTime);
                  const duration = formatDuration(booking.startTime, booking.endTime);

                  return (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-lg">{booking.client.fullName}</h3>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{startDateTime.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{startDateTime.time} - {endDateTime.time} ({duration})</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{booking.client.email}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-700">Opombe:</p>
                              <p className="text-gray-600">{booking.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ni rezervacij</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const startDateTime = formatDateTime(booking.startTime);
                  const endDateTime = formatDateTime(booking.endTime);
                  const duration = formatDuration(booking.startTime, booking.endTime);
                  const isPast = new Date(booking.startTime) < new Date();

                  return (
                    <div
                      key={booking.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isPast ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-lg">{booking.client.fullName}</h3>
                        </div>
                        <Badge 
                          variant={isPast ? "secondary" : "default"} 
                          className={isPast ? "" : "bg-green-600"}
                        >
                          {isPast ? "preteklo" : booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{startDateTime.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{startDateTime.time} - {endDateTime.time} ({duration})</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{booking.client.email}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-700">Opombe:</p>
                              <p className="text-gray-600">{booking.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
