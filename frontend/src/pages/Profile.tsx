import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Mail, MapPin, CreditCard, Dumbbell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProfileData = {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    address?: string;
    role: string;
  };
  membership: {
    package: string;
    price: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
};

type Booking = {
  id: string;
  type: "group_class" | "personal_training";
  status: "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt: string;
  className?: string;
  classDate?: string;
  schedule?: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  trainer?: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  startTime?: string;
  endTime?: string;
  duration?: number;
};

type BookingDetails = {
  id: string;
  type: "group_class" | "personal_training";
  status: "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  groupClass?: {
    id: string;
    name: string;
    schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
    capacity?: number;
  };
  classDate?: string;
  trainer?: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    address?: string;
  };
  startTime?: string;
  endTime?: string;
  duration?: number;
};

const dayNames = ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"];

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingsFilter, setBookingsFilter] = useState<"all" | "upcoming">("all");

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Napaka pri nalaganju profila:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = useCallback(async () => {
    try {
      const data = await api.getBookings({
        upcoming: bookingsFilter === "upcoming"
      });
      setBookings(data.bookings);
    } catch (error) {
      console.error("Napaka pri nalaganju rezervacij:", error);
    }
  }, [bookingsFilter]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [bookingsFilter, loadBookings]);

  const loadBookingDetails = async (id: string) => {
    try {
      const details = await api.getBookingDetails(id);
      setSelectedBooking(details);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Napaka pri nalaganju podrobnosti:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sl-SI", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("sl-SI", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">Potrjena</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Preklicana</Badge>;
      case "completed":
        return <Badge variant="secondary">Opravljena</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">Nalaganje...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-destructive">Napaka pri nalaganju profila</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Moj Profil</h1>

      <div className={`grid gap-6 ${profile.user.role === "member" ? "md:grid-cols-2" : "md:grid-cols-1 max-w-2xl"} mb-8`}>
        {/* Uporabniški podatki */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Osnovni podatki
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Ime in priimek</p>
                <p className="font-medium">
                  {profile.user.firstName && profile.user.lastName
                    ? `${profile.user.firstName} ${profile.user.lastName}`
                    : profile.user.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.user.email}</p>
              </div>
            </div>
            {profile.user.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Naslov</p>
                  <p className="font-medium">{profile.user.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vloga</p>
                <Badge variant="outline">
                  {profile.user.role === "admin" ? "Administrator" : profile.user.role === "trainer" ? "Trener" : "Član"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Naročnina - samo za člane */}
        {profile.user.role === "member" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Naročnina
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.membership ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Paket</p>
                    <p className="text-2xl font-bold">{profile.membership.package}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cena</p>
                      <p className="font-medium">{profile.membership.price}€/mesec</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {profile.membership.isActive ? (
                        <Badge variant="default">Aktivna</Badge>
                      ) : (
                        <Badge variant="destructive">Potekla</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Začetek</p>
                      <p className="font-medium text-sm">
                        {formatDate(profile.membership.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Konec</p>
                      <p className="font-medium text-sm">
                        {formatDate(profile.membership.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nimate aktivne naročnine</p>
                  <Button>Izberi paket</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rezervacije - samo za člane */}
      {profile.user.role === "member" && (
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Moje rezervacije
              </CardTitle>
              <CardDescription>
                Pregled vseh vaših rezerviranih terminov
              </CardDescription>
            </div>
            <Tabs value={bookingsFilter} onValueChange={(v) => setBookingsFilter(v as "all" | "upcoming")}>
              <TabsList>
                <TabsTrigger value="all">Vse</TabsTrigger>
                <TabsTrigger value="upcoming">Prihajajoče</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nimate rezervacij</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4" onClick={() => loadBookingDetails(booking.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {booking.type === "group_class"
                              ? booking.className
                              : "Osebni trening"}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {booking.type === "group_class" && booking.classDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.classDate)}</span>
                            </div>
                          )}
                          {booking.type === "personal_training" && booking.startTime && (
                            <>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(booking.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(booking.startTime)} - {booking.endTime && formatTime(booking.endTime)}
                                  {booking.duration && ` (${booking.duration} min)`}
                                </span>
                              </div>
                            </>
                          )}
                          {booking.trainer && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{booking.trainer.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Podrobnosti
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Dialog za podrobnosti rezervacije */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Podrobnosti rezervacije</DialogTitle>
            <DialogDescription>
              Vse informacije o vaši rezervaciji
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {selectedBooking.type === "group_class"
                    ? selectedBooking.groupClass?.name
                    : "Osebni trening"}
                </h3>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {selectedBooking.type === "group_class" && selectedBooking.groupClass && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Datum vadbe</p>
                    <p className="font-medium">
                      {selectedBooking.classDate && formatDate(selectedBooking.classDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Urnik</p>
                    <div className="space-y-1">
                      {selectedBooking.groupClass.schedule.map((slot, idx) => (
                        <p key={idx} className="font-medium">
                          {dayNames[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                        </p>
                      ))}
                    </div>
                  </div>
                  {selectedBooking.groupClass.capacity && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Kapaciteta</p>
                      <p className="font-medium">{selectedBooking.groupClass.capacity} oseb</p>
                    </div>
                  )}
                </div>
              )}

              {selectedBooking.type === "personal_training" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Datum in ura</p>
                    <p className="font-medium">
                      {selectedBooking.startTime && formatDate(selectedBooking.startTime)}
                    </p>
                    <p className="font-medium">
                      {selectedBooking.startTime && formatTime(selectedBooking.startTime)} -{" "}
                      {selectedBooking.endTime && formatTime(selectedBooking.endTime)}
                    </p>
                  </div>
                  {selectedBooking.duration && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Trajanje</p>
                      <p className="font-medium">{selectedBooking.duration} minut</p>
                    </div>
                  )}
                </div>
              )}

              {selectedBooking.trainer && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Trener</p>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedBooking.trainer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.trainer.email}</p>
                    {selectedBooking.trainer.address && (
                      <p className="text-sm text-muted-foreground">{selectedBooking.trainer.address}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Opombe</p>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 text-xs text-muted-foreground">
                <p>Ustvarjeno: {formatDate(selectedBooking.createdAt)}</p>
                <p>Posodobljeno: {formatDate(selectedBooking.updatedAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
