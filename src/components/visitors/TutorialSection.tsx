import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  PlusCircle,
  BarChart3,
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export function TutorialSection() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Créez votre compte",
      description: "Inscription gratuite en 30 secondes avec votre email",
      icon: UserPlus,
      details: [
        "Aucune carte de crédit requise",
        "Validation par email sécurisée", 
        "Accès immédiat à toutes les fonctionnalités",
        "Configuration automatique de votre profil"
      ],
      duration: "30 secondes",
      difficulty: "Très facile"
    },
    {
      title: "2. Connectez vos comptes",
      description: "Liez vos comptes bancaires en toute sécurité",
      icon: PlusCircle,
      details: [
        "Connexion sécurisée Open Banking",
        "Support de +100 banques françaises",
        "Synchronisation automatique des transactions",
        "Données chiffrées de bout en bout"
      ],
      duration: "2 minutes",
      difficulty: "Facile"
    },
    {
      title: "3. Explorez vos données",
      description: "Découvrez vos habitudes financières avec des analyses intelligentes",
      icon: BarChart3,
      details: [
        "Tableaux de bord personnalisables",
        "Catégorisation automatique des dépenses",
        "Graphiques interactifs et insights",
        "Comparaisons et tendances"
      ],
      duration: "5 minutes",
      difficulty: "Simple"
    },
    {
      title: "4. Définissez vos objectifs",
      description: "Planifiez votre avenir financier avec des objectifs intelligents",
      icon: Target,
      details: [
        "Objectifs d'épargne personnalisés",
        "Budgets adaptatifs par catégorie",
        "Alertes et rappels automatiques",
        "Conseils IA pour optimiser vos finances"
      ],
      duration: "3 minutes",
      difficulty: "Intuitif"
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-6 px-4 py-2">
          <Play className="w-4 h-4 mr-2" />
          Tutoriel interactif
        </Badge>
        <h3 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Commencez en 4 étapes
          </span>
          <br />
          <span className="text-slate-900 dark:text-white">
            simples et rapides
          </span>
        </h3>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Suivez notre guide interactif pour maîtriser BudgetFlow en moins de 10 minutes et transformer votre gestion financière.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-muted-foreground">Progression</span>
            <span className="text-sm font-medium text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xl">
            {steps.map((step, index) => (
              <Button
                key={index}
                variant={currentStep === index ? "default" : "ghost"}
                size="sm"
                className={`rounded-xl w-12 h-12 p-0 transition-all duration-300 ${
                  currentStep === index 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-110" 
                    : index < currentStep 
                      ? "bg-green-100 text-green-600 hover:bg-green-200" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
          <CardHeader className="text-center pb-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              {React.createElement(steps[currentStep].icon, { 
                className: "h-10 w-10 text-white" 
              })}
            </div>
            
            <div className="flex justify-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                ⏱️ {steps[currentStep].duration}
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                📊 {steps[currentStep].difficulty}
              </Badge>
            </div>
            
            <CardTitle className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 dark:text-slate-300">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {steps[currentStep].details.map((detail, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{detail}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {currentStep + 1}
                </div>
                <div className="text-sm text-muted-foreground">
                  sur {steps.length}
                </div>
              </div>

              <Button 
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {currentStep === steps.length - 1 ? "Terminé" : "Suivant"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl text-lg"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Voir la démo complète
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ✨ Configuration gratuite • 🚀 Prêt en 10 minutes • 🎯 Support inclus
          </p>
        </div>
      </div>
    </section>
  );
}
