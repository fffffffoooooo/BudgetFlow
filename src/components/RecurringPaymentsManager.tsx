import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, BellRing, CreditCard, Receipt, ArrowUpRight, Check, Trash2, Plus, TrendingUp, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from '@/utils/formatters';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CurrencyDisplay } from './ui/CurrencyDisplay';

interface RecurringPayment {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextPaymentDate: Date;
  isAutomatic: boolean;
  description?: string;
  reminderDays: number;
}

export function RecurringPaymentsManager() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    api.subscriptions.getAll().then(res => {
      setPayments(res.subscriptions.map((sub: any) => ({
        ...sub,
        _id: sub._id,
        category: sub.category && typeof sub.category === 'object' ? {
          ...sub.category,
          id: sub.category._id,
        } : { id: '', name: 'Sans catégorie', color: '#888' },
        nextPaymentDate: sub.nextPaymentDate ? new Date(sub.nextPaymentDate) : new Date(),
      } as RecurringPayment)));
    });
    api.categories.getAll().then(res => {
      setCategoryOptions(res.categories.map((cat: any) => ({
        id: cat._id || cat.id,
        name: cat.name,
        color: cat.color || '#888'
      })));
    });
  }, []);

  const [newPayment, setNewPayment] = useState<Partial<RecurringPayment>>({
    name: "",
    amount: 0,
    currency: 'EUR',
    frequency: "monthly",
    nextPaymentDate: new Date(),
    isAutomatic: true,
    reminderDays: 3
  });

  const frequencyOptions = [
    { value: "daily", label: "Quotidienne" },
    { value: "weekly", label: "Hebdomadaire" },
    { value: "monthly", label: "Mensuelle" },
    { value: "yearly", label: "Annuelle" }
  ];

  const handleAddPayment = async () => {
    if (!newPayment.name || !newPayment.amount || !newPayment.category) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    try {
      const payload = {
        name: newPayment.name,
        amount: newPayment.amount,
        currency: newPayment.currency,
        categoryId: (newPayment.category as any).id,
        frequency: newPayment.frequency,
        nextPaymentDate: newPayment.nextPaymentDate,
        isAutomatic: newPayment.isAutomatic,
        description: newPayment.name,
        reminderDays: newPayment.reminderDays,
      };
      const res = await api.subscriptions.create(payload);
      const sub = res.subscription;
      const newSubData: RecurringPayment = {
        ...sub,
        _id: sub._id,
        category: sub.category && typeof sub.category === 'object' ? {
          ...sub.category,
          id: sub.category._id,
        } : { id: '', name: 'Sans catégorie', color: '#888' },
        nextPaymentDate: sub.nextPaymentDate ? new Date(sub.nextPaymentDate) : new Date(),
      };
      setPayments(prev => [newSubData, ...prev]);
      setNewPayment({ name: "", amount: 0, currency: 'EUR', frequency: "monthly", nextPaymentDate: new Date(), isAutomatic: true, reminderDays: 3 });
      toast.success("Abonnement ajouté avec succès");
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'abonnement:', error);
    }
  };

  const handleToggleAutomation = async (id: string) => {
    const oldPayments = [...payments];
    const payment = payments.find(p => p._id === id);
    if (!payment) return;
    const newAutomaticState = !payment.isAutomatic;
    setPayments(payments.map(p => p._id === id ? { ...p, isAutomatic: newAutomaticState } : p));
    try {
      await api.subscriptions.update(id, { isAutomatic: newAutomaticState });
      toast.success(`Paiement automatique ${newAutomaticState ? 'activé' : 'désactivé'}.`);
    } catch (error) {
      setPayments(oldPayments);
      toast.error('Échec de la mise à jour.');
    }
  };

  const handleDelete = async (id: string) => {
    const oldPayments = [...payments];
    setPayments(prev => prev.filter(p => p._id !== id));
    try {
      await api.subscriptions.delete(id);
      toast.success("Abonnement supprimé.");
    } catch (error) {
      setPayments(oldPayments);
      toast.error("Échec de la suppression.");
    }
  };
  
  const upcomingPayments = payments
    .filter(p => {
      const daysUntil = Math.ceil((new Date(p.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
    
  const totalMonthlyCost = payments.reduce((acc, p) => {
    let monthlyAmount = p.amount;
    if (p.frequency === 'yearly') {
      monthlyAmount /= 12;
    } else if (p.frequency === 'weekly') {
      monthlyAmount *= 4.33;
    } else if (p.frequency === 'daily') {
      monthlyAmount *= 30;
    }
    return acc + monthlyAmount;
  }, 0);
  
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                <CurrencyDisplay amount={totalMonthlyCost} fromCurrency="EUR" />
            </CardTitle>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardDescription className="text-blue-700 dark:text-blue-300 font-medium">Dépenses récurrentes mensuelles</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {payments.length} abonnements et paiements récurrents
            </p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center">
                <BellRing className="mr-2 h-6 w-6" />
              {upcomingPayments.length}
            </CardTitle>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-300 font-medium">Paiements prévus ce mois</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <CurrencyDisplay amount={upcomingPayments.reduce((sum, p) => sum + p.amount, 0)} fromCurrency="EUR" /> à payer dans les 30 prochains jours
            </p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                {payments.filter(p => p.isAutomatic).length}
            </CardTitle>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardDescription className="text-green-700 dark:text-green-300 font-medium">Paiements automatisés</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-green-600 dark:text-green-400">
              {(payments.filter(p => p.isAutomatic).length / payments.length * 100).toFixed(0)}% de vos paiements sont automatisés
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-xl shadow-lg">
          <TabsTrigger value="upcoming" className="rounded-lg transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
            Paiements à venir
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
            Tous les abonnements
          </TabsTrigger>
          <TabsTrigger value="add" className="rounded-lg transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
            Ajouter un abonnement
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Paiements à venir
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Paiements prévus dans les 30 prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {upcomingPayments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingPayments.map((payment, index) => {
                    const daysUntil = Math.ceil((new Date(payment.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    return (
                      <div 
                        key={payment._id} 
                        className="group relative overflow-hidden flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-in fade-in-50 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${payment.category.color}20` }}>
                              <CreditCard className="h-6 w-6" style={{ color: payment.category.color }} />
                            </div>
                            {payment.isAutomatic && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{payment.name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <span>{payment.category.name}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                              <span>{formatDate(payment.nextPaymentDate, "short")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="text-right">
                            <div className="font-bold text-lg text-slate-900 dark:text-slate-100">
                              <CurrencyDisplay amount={payment.amount} fromCurrency={payment.currency} />
                            </div>
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {daysUntil === 0 ? "Aujourd'hui" : daysUntil === 1 ? "Demain" : `Dans ${daysUntil} jours`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                    <BellRing className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Aucun paiement prévu</h3>
                  <p className="text-slate-600 dark:text-slate-400">Aucun paiement prévu dans les 30 prochains jours</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="mt-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Tous les abonnements
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Liste complète de vos paiements récurrents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div 
                    key={payment._id} 
                    className="group relative overflow-hidden flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-in fade-in-50 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${payment.category.color}20` }}>
                        <CreditCard className="h-6 w-6" style={{ color: payment.category.color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{payment.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{payment.category.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="text-right">
                        <div className="font-bold text-lg text-slate-900 dark:text-slate-100">
                          <CurrencyDisplay amount={payment.amount} fromCurrency={payment.currency} />
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {frequencyOptions.find(f => f.value === payment.frequency)?.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                        <Switch
                          checked={payment.isAutomatic}
                            onCheckedChange={() => handleToggleAutomation(payment._id)}
                            className="data-[state=checked]:bg-emerald-500"
                        />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(payment._id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add" className="mt-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ajouter un abonnement
              </CardTitle>
              <CardDescription className="text-purple-600 dark:text-purple-400">
                Configurez un nouveau paiement récurrent pour le suivi et l'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="payment-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom</Label>
                  <Input 
                    id="payment-name" 
                    placeholder="Ex: Netflix" 
                    value={newPayment.name} 
                    onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })}
                    className="h-11 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="payment-amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant</Label>
                    <Input
                      id="payment-amount" 
                      type="number" 
                      placeholder="12.99" 
                      value={newPayment.amount} 
                      onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                      className="h-11 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment-currency" className="text-sm font-medium text-slate-700 dark:text-slate-300">Devise</Label>
                    <Input
                      id="payment-currency" 
                      placeholder="EUR" 
                      value={newPayment.currency} 
                      onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value.toUpperCase() })}
                      className="h-11 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</Label>
                  <Select onValueChange={(value) => setNewPayment({ ...newPayment, category: { id: value, name: categoryOptions.find(c => c.id === value)?.name || '', color: '' }})} value={newPayment.category?.id}>
                    <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all duration-200">
                      <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent>
                      {categoryOptions.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fréquence</Label>
                  <Select onValueChange={(value: RecurringPayment['frequency']) => setNewPayment({ ...newPayment, frequency: value })} value={newPayment.frequency}>
                    <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all duration-200">
                      <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                      {frequencyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prochain paiement</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-11 justify-start text-left font-normal border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all duration-200", !newPayment.nextPaymentDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPayment.nextPaymentDate ? format(newPayment.nextPaymentDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newPayment.nextPaymentDate}
                        onSelect={(date) => setNewPayment({ ...newPayment, nextPaymentDate: date || new Date() })} 
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                  <Switch
                    id="automatic-payment" 
                    checked={newPayment.isAutomatic}
                    onCheckedChange={(checked) => setNewPayment({ ...newPayment, isAutomatic: checked })}
                    className="data-[state=checked]:bg-purple-500"
                  />
                  <Label htmlFor="automatic-payment" className="text-sm font-medium text-slate-700 dark:text-slate-300">Paiement automatique</Label>
                </div>
                <Button 
                  onClick={handleAddPayment} 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Ajouter l'Abonnement
                </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
