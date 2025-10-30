import Hero from "@/components/Hero";
import PricingPlans from "@/components/PricingPlans";
import GroupClasses from "@/components/GroupClasses";
import PersonalTraining from "@/components/PersonalTraining";
import FinalCTA from "@/components/FinalCTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <PricingPlans />
      <GroupClasses />
      <PersonalTraining />
      <FinalCTA />
    </div>
  );
};

export default Index;
