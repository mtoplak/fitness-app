import Login from "./Login";
import Register from "./Register";

export default function AuthTest() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-6">Test prijave in registracije</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-medium mb-4">Prijava</h2>
          <Login />
        </div>
        <div>
          <h2 className="text-xl font-medium mb-4">Registracija</h2>
          <Register />
        </div>
      </div>
    </div>
  );
}

