export type ApiConfig = {
  baseUrl: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  if (!res.ok) {
    const message = (await res.json().catch(() => null))?.message || res.statusText;
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; address?: string; role?: "admin" | "trainer" | "member" }) =>
    request<{ token: string; user: { id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: string } }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    ),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  me: () => request<{ id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: string }>("/user/me"),
  
  // Profile endpoints
  getProfile: () => request<{
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
  }>("/user/profile"),
  
  getBookings: (params?: { status?: string; upcoming?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.upcoming) queryParams.append("upcoming", "true");
    const query = queryParams.toString();
    return request<{
      bookings: Array<{
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
      }>;
    }>(`/user/profile/bookings${query ? `?${query}` : ""}`);
  },
  
  getBookingDetails: (id: string) => request<{
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
  }>(`/user/profile/bookings/${id}`),

  cancelBooking: (id: string) => request<{
    message: string;
    bookingId: string;
  }>(`/user/profile/bookings/${id}`, {
    method: "DELETE"
  }),

  // Classes endpoints
  getClasses: () => request<Array<{
    _id: string;
    name: string;
    schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
    capacity?: number;
    trainerUserId?: {
      _id: string;
      firstName?: string;
      lastName?: string;
      fullName: string;
      email: string;
    };
  }>>("/classes"),

  getClass: (id: string) => request<{
    _id: string;
    name: string;
    schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
    capacity?: number;
    trainerUserId?: {
      _id: string;
      firstName?: string;
      lastName?: string;
      fullName: string;
      email: string;
    };
  }>(`/classes/${id}`),

  getClassAvailability: (id: string, date: string) => request<{
    capacity: number;
    booked: number;
    available: number;
    isFull: boolean;
  }>(`/classes/${id}/availability/${date}`),

  bookClass: (id: string, classDate: string) => request<{
    message: string;
    booking: {
      id: string;
      classDate: string;
      status: string;
    };
  }>(`/classes/${id}/book`, {
    method: "POST",
    body: JSON.stringify({ classDate })
  }),

  // Membership endpoints
  getMembershipPackages: () => request<{
    packages: Array<{
      _id: string;
      name: string;
      price: number;
    }>;
  }>("/memberships/packages"),

  getCurrentMembership: () => request<{
    membership: {
      id: string;
      package: {
        id: string;
        name: string;
        price: number;
      };
      startDate: string;
      endDate: string;
      autoRenew: boolean;
      status: "active" | "cancelled" | "expired";
      nextPackage?: {
        id: string;
        name: string;
        price: number;
      };
      cancelledAt?: string;
    } | null;
  }>("/memberships/current"),

  getMembershipHistory: () => request<{
    memberships: Array<{
      id: string;
      package: {
        id: string;
        name: string;
        price: number;
      };
      startDate: string;
      endDate: string;
      status: string;
      autoRenew: boolean;
      cancelledAt?: string;
      createdAt: string;
    }>;
  }>("/memberships/history"),

  getPayments: () => request<{
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      paymentMethod?: string;
      paymentDate?: string;
      description: string;
      createdAt: string;
    }>;
  }>("/memberships/payments"),

  subscribeToPlan: (packageId: string) => request<{
    message: string;
    membershipId: string;
  }>("/memberships/subscribe", {
    method: "POST",
    body: JSON.stringify({ packageId })
  }),

  changeMembershipPackage: (packageId: string) => request<{
    message: string;
    effectiveDate: string;
  }>("/memberships/change-package", {
    method: "POST",
    body: JSON.stringify({ packageId })
  }),

  cancelMembership: () => request<{
    message: string;
    endDate: string;
  }>("/memberships/cancel", {
    method: "POST"
  }),

  reactivateMembership: () => request<{
    message: string;
  }>("/memberships/reactivate", {
    method: "POST"
  }),

  // Class participants
  getClassParticipants: (classId: string, date: string) => request<{
    className: string;
    classDate: string;
    capacity: number;
    totalParticipants: number;
    availableSpots: number;
    participants: Array<{
      id: string;
      user: {
        id: string;
        firstName?: string;
        lastName?: string;
        fullName: string;
        email: string;
      };
      bookedAt: string;
    }>;
  }>(`/classes/${classId}/participants/${date}`),

  // Trainers
  getTrainers: () => request<Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email: string;
    hourlyRate: number;
    trainerType: "personal" | "group" | "both";
  }>>("/trainers"),

  getTrainerAvailability: (trainerId: string, date: string) => request<{
    trainerId: string;
    trainerName: string;
    date: string;
    hourlyRate: number;
    slots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      displayTime: string;
    }>;
  }>(`/trainers/${trainerId}/availability?date=${date}`),

  bookPersonalTraining: (trainerId: string, data: { startTime: string; endTime: string; notes?: string }) =>
    request<{
      message: string;
      booking: {
        id: string;
        trainerId: string;
        trainerName: string;
        startTime: string;
        endTime: string;
        status: string;
        hourlyRate: number;
      };
    }>(`/trainers/${trainerId}/book`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  getMyTrainerBookings: (upcoming?: boolean) => {
    const params = upcoming ? "?upcoming=true" : "";
    return request<{
      bookings: Array<{
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
      }>;
    }>(`/trainers/my-bookings${params}`);
  },

  // Class Management (Trainer)
  getMyClasses: () => request<{
    classes: Array<{
      _id: string;
      name: string;
      description?: string;
      difficulty?: "easy" | "medium" | "hard";
      duration?: number;
      capacity?: number;
      schedule: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>;
      trainerUserId?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>("/classes/my-classes/list"),

  createClass: (data: {
    name: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
    duration?: number;
    capacity?: number;
    schedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }) => request<{
    message: string;
    class: {
      _id: string;
      name: string;
      description?: string;
      difficulty?: string;
      duration?: number;
      capacity?: number;
    };
  }>("/classes/create", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  updateClass: (id: string, data: {
    name?: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
    duration?: number;
    capacity?: number;
    schedule?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }) => request<{
    message: string;
    class: {
      _id: string;
      name: string;
      description?: string;
      difficulty?: string;
      duration?: number;
      capacity?: number;
    };
  }>(`/classes/${id}/update`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),

  deleteClass: (id: string) => request<{
    message: string;
  }>(`/classes/${id}/delete`, {
    method: "DELETE"
  }),

  // Admin endpoints - generic GET for flexible usage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (path: string) => request<any>(path),
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: (path: string, data?: any) => request<any>(path, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined
  }),
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: (path: string, data?: any) => request<any>(path, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined
  }),
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (path: string) => request<any>(path, {
    method: "DELETE"
  }),
};



