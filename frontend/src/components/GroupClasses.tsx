import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const classes = [
  {
    name: "HIIT Blast",
    description: "Visoko intenzivni intervalni trening za maksimalno sežiganje kalorij in povečanje vzdržljivosti. Pripravite se na največji izziv!",
    schedule: "Ponedeljek, sreda, petek",
    time: "ob 18:00",
    image: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=2070&auto=format&fit=crop"
  },
  {
    name: "Yoga Flow",
    description: "Umirjajoča yoga vadba za večjo fleksibilnost, ravnotežje in notranji mir. Popolno za sproščanje stresa po napornem dnevu.",
    schedule: "Torek, četrtek",
    time: "ob 19:00",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop"
  },
  {
    name: "Spin Cycle",
    description: "Energična kolesarska vadba ob motivacijski glasbi. Izboljšajte kardiovaskularno pripravljenost in oblikujte noge.",
    schedule: "Ponedeljek, sreda, petek",
    time: "ob 17:00",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=2074&auto=format&fit=crop"
  },
  {
    name: "Zumba Dance",
    description: "Plesna vadba polna zabave in energije! Sežigajte kalorije medtem ko se zabavate in učite novih plesnih korakov.",
    schedule: "Torek, četrtek, sobota",
    time: "ob 18:30",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop"
  },
];

const GroupClasses = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Skupinske vadbe</h2>
          <p className="text-lg text-muted-foreground">
            Pridružite se našim energičnim skupinskim vadbam, ki jih vodijo certificirani inštruktorji. 
            Zabava, motivacija in rezultati v eni izkušnji!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {classes.map((classItem, index) => (
            <Card
              key={index}
              className="p-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group overflow-hidden"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={classItem.image}
                  alt={classItem.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                  {classItem.name}
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-muted-foreground mb-6 min-h-[120px]">
                  {classItem.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{classItem.schedule}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{classItem.time}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/urnik">Poglej urnik</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GroupClasses;
