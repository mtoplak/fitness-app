import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(15,85%,55%,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Dobrodošli na strani fitnes{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(10,90%,50%)] bg-clip-text text-transparent">
              WiiFit
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Transformirajte svoje telo in um s personalnimi treningi, skupinskimi vadami in vrhunsko opremo. 
            Vaša fitnes transformacija se začne tukaj.
          </p>
          
          <div className="pt-4">
            <Button size="lg" className="text-lg px-8 py-6 group">
              Poglej ponudbo
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
