import { useMemo, useState } from "react";

type Sex = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "lose" | "maintain" | "gain";
type Preference = "balanced" | "high_protein" | "plant_forward";

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export default function ProteinCalculator() {
  const [weightKg, setWeightKg] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [sex, setSex] = useState<Sex>("male");
  const [bodyFat, setBodyFat] = useState<string>("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [preference, setPreference] = useState<Preference>("balanced");
  const [meals, setMeals] = useState<string>("3");
  const [submitted, setSubmitted] = useState(false);

  const numeric = useMemo(() => {
    const w = parseFloat(weightKg) || 0;
    const h = parseFloat(heightCm) || 0;
    const a = parseFloat(age) || 0;
    const bf = clamp(parseFloat(bodyFat) || 0, 0, 60);
    const m = clamp(parseInt(meals || "3") || 3, 1, 8);
    return { w, h, a, bf, m };
  }, [weightKg, heightCm, age, bodyFat, meals]);

  const lbmKg = useMemo(() => {
    if (numeric.w <= 0) return 0;
    if (numeric.bf > 0) {
      return numeric.w * (1 - numeric.bf / 100);
    }
    return 0; // unknown if no body fat
  }, [numeric]);

  const bmr = useMemo(() => {
    if (lbmKg > 0) {
      // Katch-McArdle
      return Math.round(370 + 21.6 * lbmKg);
    }
    // Mifflin-St Jeor
    if (numeric.w > 0 && numeric.h > 0 && numeric.a > 0) {
      const s = sex === "male" ? 5 : -161;
      return Math.round(10 * numeric.w + 6.25 * numeric.h - 5 * numeric.a + s);
    }
    return 0;
  }, [lbmKg, numeric, sex]);

  const activityFactor = useMemo(() => {
    switch (activity) {
      case "sedentary": return 1.2;
      case "light": return 1.375;
      case "moderate": return 1.55;
      case "active": return 1.725;
      case "very_active": return 1.9;
      default: return 1.55;
    }
  }, [activity]);

  const tdee = useMemo(() => {
    if (bmr <= 0) return 0;
    return Math.round(bmr * activityFactor);
  }, [bmr, activityFactor]);

  const proteinPerKg = useMemo(() => {
    // base by activity
    let base = 1.6; // default
    if (activity === "sedentary") base = 1.2;
    if (activity === "light") base = 1.4;
    if (activity === "moderate") base = 1.6;
    if (activity === "active") base = 1.8;
    if (activity === "very_active") base = 2.0;

    // adjust by goal
    if (goal === "lose") base += 0.2;
    if (goal === "gain") base += 0.2;

    // adjust by preference
    if (preference === "high_protein") base += 0.2;
    if (preference === "plant_forward") base += 0.1;

    // if body fat high, prefer per LBM instead of total mass
    return clamp(base, 1.0, 2.4);
  }, [activity, goal, preference]);

  const proteinGrams = useMemo(() => {
    const useWeight = numeric.bf >= 15 ? lbmKg || numeric.w * 0.8 : numeric.w; // fallback heuristic
    const grams = useWeight * proteinPerKg;
    if (!isFinite(grams) || grams <= 0) return 0;
    return Math.round(grams);
  }, [numeric, lbmKg, proteinPerKg]);

  const perMeal = useMemo(() => {
    if (proteinGrams <= 0 || numeric.m <= 0) return 0;
    return Math.round(proteinGrams / numeric.m);
  }, [proteinGrams, numeric.m]);

  const fatRange = useMemo(() => {
    // 0.8–1.0 g/kg typical range
    const min = Math.round(numeric.w * 0.8);
    const max = Math.round(numeric.w * 1.0);
    return { min, max };
  }, [numeric.w]);

  const carbsSuggestion = useMemo(() => {
    // rough suggestion after protein/fat; 4 kcal/g for both protein and carbs, 9 kcal/g for fat
    if (tdee <= 0 || proteinGrams <= 0) return 0;
    const proteinKcal = proteinGrams * 4;
    const fatKcal = ((fatRange.min + fatRange.max) / 2) * 9;
    let remaining = tdee - proteinKcal - fatKcal;
    if (goal === "lose") remaining *= 0.9;
    if (goal === "gain") remaining *= 1.05;
    const carbs = Math.max(0, Math.round(remaining / 4));
    return carbs;
  }, [tdee, proteinGrams, fatRange, goal]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section style={{ background: "#ffffff" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 16px", color: "#0b0b0b" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Napredni beljakovinski kalkulator</h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          Ta kalkulator oceni tvoj dnevni vnos beljakovin na podlagi teže, višine, starosti, spola,
          odstotka telesne maščobe, aktivnosti, cilja in prehranskih preferenc. Če vneseš telesno maščobo,
          bomo uporabili formulo Katch–McArdle (po pusti masi); sicer Mifflin–St Jeor. Rezultat razdelimo tudi na obroke.
        </p>
        <ul style={{ opacity: 0.8, fontSize: 14, marginBottom: 24, paddingLeft: 18 }}>
          <li>BMR: Katch–McArdle (če podaš % maščobe), sicer Mifflin–St Jeor</li>
          <li>TDEE: BMR × faktor aktivnosti</li>
          <li>Beljakovine: dinamični g/kg glede na aktivnost, cilj in preferenco; pri višjem % maščobe raje po pusti masi</li>
          <li>Dodatno: okvir maščob (0.8–1.0 g/kg) in ocena OH iz preostalih kalorij</li>
        </ul>

        <form onSubmit={onSubmit} style={{ background: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Teža (kg)</label>
              <input inputMode="decimal" placeholder="npr. 70" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Višina (cm)</label>
              <input inputMode="decimal" placeholder="npr. 175" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Starost</label>
              <input inputMode="numeric" placeholder="npr. 28" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Spol</label>
              <select value={sex} onChange={(e) => setSex(e.target.value as Sex)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }}>
                <option value="male">Moški</option>
                <option value="female">Ženska</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Telesna maščoba (%)</label>
              <input inputMode="decimal" placeholder="npr. 18" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Obroki na dan</label>
              <input inputMode="numeric" placeholder="3" value={meals} onChange={(e) => setMeals(e.target.value)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Aktivnost</label>
              <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }}>
                <option value="sedentary">Nizka</option>
                <option value="light">Lahka</option>
                <option value="moderate">Zmerna</option>
                <option value="active">Visoka</option>
                <option value="very_active">Zelo visoka</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Cilj</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }}>
                <option value="lose">Zmanjšanje teže</option>
                <option value="maintain">Vzdrževanje</option>
                <option value="gain">Pridobivanje mišic</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Prehranska preferenca</label>
              <select value={preference} onChange={(e) => setPreference(e.target.value as Preference)} style={{ width: "100%", border: "1px solid #d0d0d0", background: "#ffffff", color: "#0b0b0b", borderRadius: 8, padding: "10px 12px" }}>
                <option value="balanced">Uravnoteženo</option>
                <option value="high_protein">Visoko-beljakovinsko</option>
                <option value="plant_forward">Rastlinsko usmerjeno</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 12,
              background: "#f97316",
              color: "#ffffff",
              padding: "12px 18px",
              borderRadius: 10,
              border: 0,
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(249, 115, 22, 0.35)",
              letterSpacing: 0.2,
            }}
          >
            Izračunaj
          </button>

          {submitted && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div style={{ background: "#f6f6f6", border: "1px solid #eaeaea", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 12, opacity: 0.8 }}>BMR / TDEE</p>
                <p style={{ margin: 0 }}>BMR: <b>{bmr || "–"}</b> kcal</p>
                <p style={{ margin: 0 }}>TDEE: <b>{tdee || "–"}</b> kcal</p>
              </div>
              <div style={{ background: "#f6f6f6", border: "1px solid #eaeaea", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 12, opacity: 0.8 }}>Beljakovine</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{proteinGrams} g/dan</p>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>≈ {perMeal} g na obrok ({numeric.m} obrokov)</p>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.6, marginTop: 4 }}>Osnova: {proteinPerKg.toFixed(1)} g/kg {numeric.bf >= 15 ? "(po LBM)" : "(po teži)"}</p>
              </div>
              <div style={{ background: "#f6f6f6", border: "1px solid #eaeaea", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 12, opacity: 0.8 }}>Maščobe (priporočilo)</p>
                <p style={{ margin: 0 }}>{fatRange.min}–{fatRange.max} g/dan</p>
              </div>
              <div style={{ background: "#f6f6f6", border: "1px solid #eaeaea", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 12, opacity: 0.8 }}>Ogljikovi hidrati (ocena)</p>
                <p style={{ margin: 0 }}>{carbsSuggestion} g/dan</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
