import { Link } from 'react-router-dom';
import { Receipt, ArrowRight, Scan, Users, Calculator, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Scan,
    title: 'AI-Powered Scanning',
    description: 'Upload a photo of any bill or receipt and our AI will automatically extract all items, prices, and totals.',
  },
  {
    icon: Users,
    title: 'Flexible Splitting',
    description: 'Assign items to 1-5 people with support for uneven splits. Perfect for group dinners or shared expenses.',
  },
  {
    icon: Calculator,
    title: 'Automatic Tax Split',
    description: 'Tax is automatically distributed proportionally based on each person\'s share of the bill.',
  },
  {
    icon: History,
    title: 'Bill History',
    description: 'Save and access past bills anytime. Duplicate or edit previous splits with ease.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Receipt className="w-4 h-4" />
              Smart Bill Splitting Made Easy
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Split Bills with
              <span className="text-primary"> AI-Powered </span>
              Precision
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Scan any receipt, assign items to friends, and calculate fair splits instantly. 
              No more awkward math at the dinner table.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/bill-splitter">
                <Button size="lg" className="gap-2 px-8 shadow-glow">
                  Start Splitting
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our smart bill splitter handles all the complexity so you can focus on enjoying time with friends.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/20 border-primary/20">
            <div className="text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Split Your First Bill?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Upload a photo, add your friends, and let our AI do the rest. It's that simple.
              </p>
              <Link to="/bill-splitter">
                <Button size="lg" className="gap-2 px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-primary">
                <Receipt className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">Pocket Finance Kit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Smart Bill Splitter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
