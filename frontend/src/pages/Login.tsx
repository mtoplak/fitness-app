import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Napaka pri prijavi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto max-w-md py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Prijava</h1>
        <form onSubmit={onSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            {loading ? "Prijava..." : "Prijava"}
          </Button>
        </form>
      </div>
    </section>
  );
}



