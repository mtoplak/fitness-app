import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Začetni Paket",
    price: 29,
    features: [
      "Neomejen dostop do telovadnice",
      "Osnovna oprema",
      "Prosti treningi",
      "Garderobne omarice",
    ],
  },
  {
    name: "Premium Paket",
    price: 49,
    features: [
      "Vse iz začetnega paketa",
      "Skupinske vadbe (do 10 mesečno)",
      "Nutrition plan pogovor",
      "Dostop do spalnice",
      "Brezplačna vadba za prijatelja 2x mesečno",
    ],
    popular: true,
  },
  {
    name: "Elite Paket",
    price: 55,
    features: [
      "Vse iz premium paketa",
      "Neomejene skupinske vadbe",
      "2x mesečni personal training",
      "Prehransko svetovanje",
      "Prioritetno rezerviranje",
      "Brezplačni fitness meritve",
    ],
  },
];

const PricingPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Array<{ _id: string; name: string; price: number }>>([]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await api.getMembershipPackages();
        setPackages(data.packages);
      } catch (error) {
        console.error("Napaka pri nalaganju paketov:", error);
      }
    };
    void loadPackages();
  }, []);

  const handleSelectPlan = (packageId: string, packageName: string) => {
    // Če uporabnik ni prijavljen, preusmeri na registracijo
    if (!user) {
      toast({
        title: "Prijava potrebna",
        description: "Za izbiro paketa se morate najprej prijaviti ali registrirati",
      });
      // Shrani izbrani paket v localStorage za pozneje
      localStorage.setItem("selectedPackage", packageId);
      navigate("/register");
      return;
    }

    // Če uporabnik ni član, ne more kupiti paketa
    if (user.role !== "member") {
      toast({
        title: "Samo za člane",
        description: "Samo člani lahko kupijo paket naročnine",
        variant: "destructive"
      });
      return;
    }

    // Preusmeri na stran za upravljanje naročnine
    localStorage.setItem("selectedPackage", packageId);
    navigate("/membership");
  };

  return (
    <section id="ponudba" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Plan paketa</h2>
          <p className="text-lg text-muted-foreground">
            Izberite paket, ki ustreza vašim fitnes ciljem. Vsak paket vključuje vrhunske storitve za vašo transformacijo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            // Najdi paket iz API-ja, ki ustreza imenu
            const apiPackage = packages.find(p => p.name === plan.name);
            
            return (
              <Card
                key={index}
                className={`p-8 relative hover:shadow-xl transition-all duration-300 ${
                  plan.popular
                    ? "border-primary border-2 scale-105"
                    : "hover:scale-105"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Najbolj priljubljen
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground ml-2">/mesec</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => apiPackage && handleSelectPlan(apiPackage._id, apiPackage.name)}
                  disabled={!apiPackage}
                >
                  Izberi {plan.name}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
