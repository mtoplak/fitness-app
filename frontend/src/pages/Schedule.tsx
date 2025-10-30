import { useEffect, useMemo, useState } from "react";

type WeeklyTimeSlot = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

type GroupClass = {
  _id: string;
  name: string;
  schedule: WeeklyTimeSlot[];
  capacity?: number;
};

const dayNames = ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"];

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(m: number): string {
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function Schedule() {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    fetch(`${API}/classes`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({} as any))).message || res.statusText);
        return res.json();
      })
      .then((data: GroupClass[]) => setClasses(data))
      .catch((e) => setError(e.message || "Napaka pri nalaganju urnika"))
      .finally(() => setLoading(false));
  }, []);

  const timetable = useMemo(() => {
    const startOfDay = 6 * 60; // 06:00
    const endOfDay = 22 * 60;  // 22:00
    const step = 30; // minutes
    const rows: number[] = [];
    for (let m = startOfDay; m <= endOfDay; m += step) rows.push(m);

    const byDay: Record<number, Array<{ className: string; start: number; end: number }>> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const c of classes) {
      for (const s of c.schedule || []) {
        byDay[s.dayOfWeek].push({ className: c.name, start: toMinutes(s.startTime), end: toMinutes(s.endTime) });
      }
    }
    for (let d = 0; d < 7; d++) {
      byDay[d].sort((a, b) => a.start - b.start);
    }
    return { rows, byDay };
  }, [classes]);

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto max-w-6xl py-16 px-4">
        <h1 className="text-3xl font-bold mb-6">Urnik skupinskih vadb</h1>
        {loading && <p className="text-muted-foreground">Nalagam...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background z-10 w-20 text-left text-sm font-medium text-muted-foreground py-2 pr-2">Čas</th>
                  {dayNames.map((d, i) => (
                    <th key={i} className="text-left text-sm font-medium text-muted-foreground py-2 px-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetable.rows.map((minute, rowIdx) => {
                  const label = minutesToLabel(minute);
                  // track covered cells for rowSpan
                  const row: (JSX.Element | null)[] = [];
                  row.push(
                    <td key={`time-${rowIdx}`} className="sticky left-0 bg-background z-10 align-top text-xs text-muted-foreground py-3 pr-2 border-t border-border">
                      {label}
                    </td>
                  );

                  for (let day = 0; day < 7; day++) {
                    // find if a class starts now
                    const starting = timetable.byDay[day].find((c) => c.start === minute);
                    // find if this time is covered by a previous rowSpan of a class already rendered
                    const covering = timetable.byDay[day].find((c) => c.start < minute && c.end > minute);
                    if (starting) {
                      const duration = Math.max(1, Math.ceil((starting.end - starting.start) / 30));
                      row.push(
                        <td
                          key={`d${day}-r${rowIdx}`}
                          rowSpan={duration}
                          className="align-top border-t border-l first:border-l-0 border-border px-2 py-2"
                        >
                          <div className="rounded-md border border-border bg-card p-2">
                            <div className="text-xs text-muted-foreground">{minutesToLabel(starting.start)}–{minutesToLabel(starting.end)}</div>
                            <div className="text-sm font-semibold">{starting.className}</div>
                          </div>
                        </td>
                      );
                    } else if (covering) {
                      // cell is covered by rowSpan above; skip
                      row.push(null);
                    } else {
                      row.push(
                        <td key={`d${day}-r${rowIdx}`} className="border-t border-l first:border-l-0 border-border px-2 py-2" />
                      );
                    }
                  }
                  return <tr key={rowIdx}>{row}</tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}


