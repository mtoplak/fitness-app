import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(15,85%,55%,0.15),transparent_50%)]" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Pripravljeni na svojo fitnes{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(10,90%,50%)] bg-clip-text text-transparent">
              preobrazbo?
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground">
            Pridruži se naši skupnosti in danes naredi prvi korak k boljšemu zdravju, močnejšemu telesu in 
            večjemu samozavestju. Zavezani smo tvojemu uspehu!
          </p>
          
          <div className="pt-4">
            <Button size="lg" className="text-lg px-8 py-6 group">
              Pridruži se nam
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
