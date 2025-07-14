
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Check, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez saisir votre adresse e-mail");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulation d'appel API pour réinitialisation de mot de passe
      // Dans une application réelle, ceci serait implémenté avec un appel à l'API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast.success("Instructions de réinitialisation envoyées par e-mail");
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      toast.error("Impossible d'envoyer les instructions de réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
          <p className="text-muted-foreground mt-2">
            Réinitialisez votre mot de passe pour accéder à votre compte
          </p>
        </div>

        <Card>
          {isSuccess ? (
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/20">
                  <Check className="h-6 w-6 text-success" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Vérifiez votre boîte mail</h2>
              <p className="text-muted-foreground">
                Nous avons envoyé un e-mail à <strong>{email}</strong> avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button className="w-full">Retour à la connexion</Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Réinitialisation de mot de passe</CardTitle>
                <CardDescription>
                  Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <div className="w-full space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Envoi en cours..." : "Envoyer les instructions"}
                  </Button>
                  
                  <div className="text-center">
                    <Link 
                      to="/login"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Retour à la connexion
                    </Link>
                  </div>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
