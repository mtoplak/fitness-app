import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PricingPlans from "@/components/PricingPlans";
import GroupClasses from "@/components/GroupClasses";
import PersonalTraining from "@/components/PersonalTraining";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <PricingPlans />
      <GroupClasses />
      <PersonalTraining />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
