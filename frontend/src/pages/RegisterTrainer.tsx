import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterTrainer() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ firstName, lastName, address, email, password, role: "trainer" });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Napaka pri registraciji trenerja");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto max-w-md py-16 px-4">
        <h1 className="text-3xl font-bold mb-2">Registracija trenerja</h1>
        <p className="text-muted-foreground mb-8">Ustvari trenerski račun za dostop do nadzorne plošče trenerja.</p>
        <form onSubmit={onSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="Ime"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Priimek"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Naslov"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Geslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button disabled={loading} className="w-full">
            {loading ? "Registracija..." : "Ustvari trenerski račun"}
          </Button>
        </form>
      </div>
    </section>
  );
}

