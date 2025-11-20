import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}

