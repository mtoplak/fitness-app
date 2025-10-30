import { Button } from "@/components/ui/button";
import { Target, Users, Trophy, Heart } from "lucide-react";

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

        <div className="max-w-4xl mx-auto mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">Tvoja pot, tvoj trener</h3>
          <p className="text-lg text-center text-muted-foreground mb-12">
            Dolžni prilagojene fitnes programe, zasnovane glede na tvoje potrebe in cilje. 
            Od izgube teže do pridobivanja moči – naši trenerji so tukaj zate.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
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

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-6">
            Poglej ponudbo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PersonalTraining;
