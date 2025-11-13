import { Button } from "@/components/ui/button";
import { Target, Users, Trophy, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Target,
    title: "Personalizirani program",
    description: "Vsak trening je prilagojen vašim ciljem, fitnes ravni in potrebam za optimalne rezultate.",
  },
  {
    icon: Users,
    title: "Certificirani trenerji",
    description: "Naši izkušeni trenerji imajo vrhunske certifikate in bogate izkušnje z transformacijami strank.",
  },
  {
    icon: Trophy,
    title: "Dokazani rezultati",
    description: "95% naših strank doseže svoje cilje v načrtovanem času zahvaljujoč strokovnemu vodenju.",
  },
  {
    icon: Heart,
    title: "Celosten pristop",
    description: "Kombinacija treninga, prehrane in mentalne pripravljenosti za trajnostne spremembe.",
  },
];

const PersonalTraining = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Osebno trenerstvo</h2>
          <p className="text-lg text-muted-foreground">
            Personalizirani treningi, ki so narejeni posebej za vas. Naši strokovni trenerji vas bodo vodili 
            skozi celoten proces transformacije - od prvega koraka do končnega cilja.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-16">
          <div className="order-2 lg:order-1">
            <h3 className="text-3xl font-bold mb-6">Tvoja pot, tvoj trener</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Dolžni prilagojene fitnes programe, zasnovane glede na tvoje potrebe in cilje. 
              Od izgube teže do pridobivanja moči – naši trenerji so tukaj zate.
            </p>

            <div className="grid gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-6 rounded-lg bg-card hover:bg-accent/10 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop"
                alt="Personal training session"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <a href="#ponudba">Poglej ponudbo</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PersonalTraining;
