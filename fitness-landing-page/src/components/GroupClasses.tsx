import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

const classes = [
  {
    name: "HIIT Blast",
    description: "Visoko intenzivni intervalni trening za maksimalno sežiganje kalorij in povečanje vzdržljivosti. Pripravite se na največji izziv!",
    schedule: "Ponedeljek, sreda, petek",
    time: "ob 18:00",
  },
  {
    name: "Yoga Flow",
    description: "Umirjajoča yoga vadba za večjo fleksibilnost, ravnotežje in notranji mir. Popolno za sproščanje stresa po napornem dnevu.",
    schedule: "Torek, četrtek",
    time: "ob 19:00",
  },
  {
    name: "Spin Cycle",
    description: "Energična kolesarska vadba ob motivacijski glasbi. Izboljšajte kardiovaskularno pripravljenost in oblikujte noge.",
    schedule: "Ponedeljek, sreda, petek",
    time: "ob 17:00",
  },
  {
    name: "Zumba Dance",
    description: "Plesna vadba polna zabave in energije! Sežigajte kalorije medtem ko se zabavate in učite novih plesnih korakov.",
    schedule: "Torek, četrtek, sobota",
    time: "ob 18:30",
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
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group"
            >
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {classItem.name}
              </h3>
              
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

              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Poglej urnik
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GroupClasses;
