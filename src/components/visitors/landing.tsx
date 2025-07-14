import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  BarChart3, 
  PieChart, 
  Wallet, 
  Target,
  Shield,
  Smartphone,
  Star,
  Users,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeaturesSection } from './FeaturesSection';
import { TutorialSection } from './TutorialSection';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header avec navigation améliorée */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  BudgetFlow
                </h1>
                <p className="text-xs text-muted-foreground">Gérez vos finances</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')} className="hover:bg-blue-50">
                Se connecter
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Créer un compte
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section améliorée */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        {/* Éléments décoratifs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <Badge variant="secondary" className="mb-6 px-6 py-2 text-sm font-medium bg-blue-100 text-blue-700 border-blue-200">
            <Star className="w-4 h-4 mr-2" />
            Nouveau : Import automatique des transactions
          </Badge>
          
          <h2 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Maîtrisez
            </span>
            <br />
            <span className="text-slate-900 dark:text-white">vos finances</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              en toute simplicité
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            BudgetFlow transforme la gestion de vos finances en une expérience intuitive et puissante. 
            Analysez vos dépenses, planifiez votre budget et atteignez vos objectifs financiers avec des outils intelligents.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 h-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300" 
              onClick={() => navigate('/register')}
            >
              Commencer gratuitement
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-10 py-6 h-auto border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Voir la démo
            </Button>
          </div>

          {/* Indicateurs sociaux */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>+10 000 utilisateurs actifs</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>4.9/5 étoiles</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Sécurisé et confidentiel</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section modernisée */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { value: "100%", label: "Gratuit", desc: "Toutes les fonctionnalités", icon: CheckCircle },
            { value: "2min", label: "Configuration", desc: "Mise en route rapide", icon: TrendingUp },
            { value: "24/7", label: "Disponible", desc: "Accès permanent", icon: Smartphone },
            { value: "99%", label: "Satisfaction", desc: "Clients satisfaits", icon: Star }
          ].map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="pt-8 pb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-2">
                  {stat.value}
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1">{stat.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Tutorial Section */}
      <TutorialSection />

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl mx-4 my-16">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold mb-4">
            Ce que disent nos utilisateurs
          </h3>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Découvrez comment BudgetFlow a transformé la gestion financière de milliers de personnes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Marie Dubois",
              role: "Entrepreneur",
              content: "BudgetFlow m'a permis de reprendre le contrôle de mes finances. L'interface est intuitive et les analyses sont très utiles.",
              rating: 5
            },
            {
              name: "Thomas Martin",
              role: "Freelance",
              content: "Depuis que j'utilise BudgetFlow, j'ai économisé 30% de plus chaque mois. Les alertes de budget sont parfaites !",
              rating: 5
            },
            {
              name: "Sophie Laurent",
              role: "Étudiante",
              content: "Enfin une app qui rend la gestion de budget amusante ! Les graphiques m'aident à visualiser mes progrès.",
              rating: 5
            }
          ].map((testimonial, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-blue-100 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-blue-200">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section finale */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
          <CardContent className="text-center py-16 relative z-10">
            <h3 className="text-4xl font-bold mb-6">
              Prêt à transformer votre relation à l'argent ?
            </h3>
            <p className="text-xl mb-8 text-slate-300 max-w-2xl mx-auto">
              Rejoignez plus de 10 000 utilisateurs qui ont déjà pris le contrôle de leurs finances avec BudgetFlow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 h-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl"
                onClick={() => navigate('/register')}
              >
                Créer mon compte gratuit
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-10 py-6 h-auto border-white/20 text-white hover:bg-white/10"
              >
                Planifier une démo
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-6">
              Aucune carte bancaire requise • Configuration en 2 minutes • Support gratuit
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer amélioré */}
      <footer className="container mx-auto px-4 py-12 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">BudgetFlow</span>
            </div>
            <p className="text-muted-foreground text-sm">
              La solution complète pour gérer vos finances personnelles avec simplicité et efficacité.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Produit</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sécurité</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tutoriels</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">CGU</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-muted-foreground border-t border-slate-200 dark:border-slate-700 pt-8">
          <p>&copy; 2024 BudgetFlow. Tous droits réservés. Fait avec ❤️ au Maroc.</p>
        </div>
      </footer>
    </div>
  );
}
