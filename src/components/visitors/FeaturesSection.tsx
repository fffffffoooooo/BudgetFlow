import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  Target,
  Shield,
  Smartphone,
  Bell,
  TrendingUp,
  Calculator,
  Zap,
  Download
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: BarChart3,
      title: "Tableau de bord intelligent",
      description: "Visualisez vos finances en temps réel avec des graphiques interactifs et des insights personnalisés.",
      badge: "Populaire"
    },
    {
      icon: PieChart,
      title: "Analyse des dépenses",
      description: "Découvrez vos habitudes de consommation avec des analyses détaillées par catégorie et période.",
      badge: null
    },
    {
      icon: Target,
      title: "Objectifs financiers",
      description: "Définissez et suivez vos objectifs d'épargne avec des conseils personnalisés pour les atteindre.",
      badge: null
    },
    {
      icon: Bell,
      title: "Alertes intelligentes",
      description: "Recevez des notifications proactives pour optimiser vos finances et éviter les dépassements.",
      badge: null
    },
    {
      icon: TrendingUp,
      title: "Prévisions et tendances",
      description: "Anticipez vos finances futures grâce à l'IA et l'analyse prédictive de vos données.",
      badge: "IA"
    },
    {
      icon: Calculator,
      title: "Automation intelligente",
      description: "Catégorisez automatiquement vos transactions et créez des rapports financiers en un clic.",
      badge: "Nouveau"
    },
    {
      icon: Smartphone,
      title: "Multi-plateformes",
      description: "Accédez à vos finances depuis n'importe quel appareil avec une synchronisation en temps réel.",
      badge: null
    },
    {
      icon: Download,
      title: "Import bancaire",
      description: "Importez automatiquement vos transactions depuis plus de 100 banques françaises.",
      badge: "Bientôt"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-6 px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          Fonctionnalités
        </Badge>
        <h3 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tout ce dont vous avez besoin
          </span>
          <br />
          <span className="text-slate-900 dark:text-white">
            pour gérer vos finances
          </span>
        </h3>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Des outils puissants et intuitifs conçus pour simplifier votre gestion financière et vous aider à atteindre vos objectifs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden">
            {feature.badge && (
              <Badge 
                variant={feature.badge === "Populaire" ? "default" : feature.badge === "IA" ? "secondary" : "outline"}
                className="absolute top-4 right-4 z-10"
              >
                {feature.badge}
              </Badge>
            )}
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
            
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
          </Card>
        ))}
      </div>

      <div className="mt-20 text-center">
        <Card className="max-w-4xl mx-auto border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="py-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h4 className="text-2xl font-bold mb-4 text-green-800 dark:text-green-300">
              Sécurité de niveau bancaire
            </h4>
            <p className="text-green-700 dark:text-green-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Vos données financières sont protégées par un chiffrement AES-256 et des protocoles de sécurité conformes aux standards bancaires européens. 
              Nous ne vendons jamais vos informations personnelles.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm">
              <Badge variant="outline" className="bg-white/50">🇪🇺 RGPD Conforme</Badge>
              <Badge variant="outline" className="bg-white/50">🔒 Chiffrement AES-256</Badge>
              <Badge variant="outline" className="bg-white/50">🛡️ ISO 27001</Badge>
              <Badge variant="outline" className="bg-white/50">✅ Open Banking</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
