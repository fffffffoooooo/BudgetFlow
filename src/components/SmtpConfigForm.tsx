import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api, apiRequest } from '@/services/api';

interface SmtpConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  secure: boolean;
}

interface ApiResponse<T = any> {
  data?: T;
  success?: boolean;
  error?: string;
}

const defaultConfig: SmtpConfig = {
  email: '',
  password: '',
  host: '',
  port: 465,
  secure: true,
};

export const SmtpConfigForm: React.FC = () => {
  const [config, setConfig] = useState<SmtpConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('Autre');

  // Préconfigurations SMTP standard
  const PROVIDERS = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 465, secure: true },
    { name: 'Outlook (Office365)', host: 'smtp.office365.com', port: 587, secure: true },
    { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    { name: 'Autre', host: '', port: 465, secure: true },
  ];

  useEffect(() => {
    // Charger la config SMTP existante
    (async () => {
      setLoading(true);
      try {
        const res = await apiRequest<ApiResponse<SmtpConfig>>('/admin/smtp-config', 'GET');
        const response = res as ApiResponse<SmtpConfig>;
        if (response.data) {
          setConfig((prev) => ({
            ...prev,
            ...response.data,
            password: '', // Ne jamais pré-remplir le mot de passe
          }));
        }
      } catch (e: any) {
        // Pas de config existante ou erreur
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = PROVIDERS.find(p => p.name === e.target.value);
    setProvider(e.target.value);
    if (selected) {
      setConfig(prev => ({
        ...prev,
        host: selected.host,
        port: selected.port,
        secure: selected.secure
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);
    try {
      if (!config.email || !config.password || !config.host || !config.port) {
        toast.error('Tous les champs SMTP sont obligatoires.');
        return;
      }
      await apiRequest('/admin/smtp-config', 'PUT', config);
      toast.success('Configuration SMTP enregistrée.');
      setConfig((prev) => ({ ...prev, password: '' })); // Reset password field
    } catch (err: any) {
      toast.error('Erreur lors de l\'enregistrement de la configuration SMTP.', { description: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const testEmail = prompt('Adresse email de test (admin) :');
      if (!testEmail) return;
      const res = await apiRequest<ApiResponse<{ success: boolean; error?: string }>>('/admin/smtp-config/test', 'POST', { to: testEmail });
      const response = res as ApiResponse<{ success: boolean; error?: string }>;
      if (response && response.success === true) {
        setTestResult('Email de test envoyé avec succès !');
        toast.success('Email de test envoyé avec succès !');
      } else {
        setTestResult('Erreur lors de l\'envoi de l\'email de test.');
        toast.error('Erreur lors de l\'envoi de l\'email de test.', { description: response?.error || 'Erreur inconnue' });
      }
    } catch (err: any) {
      setTestResult('Erreur lors de l\'envoi de l\'email de test.');
      toast.error('Erreur lors de l\'envoi de l\'email de test.', { description: err?.response?.data?.error || err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="smtp-provider">Fournisseur Email</Label>
          <select
            id="smtp-provider"
            name="provider"
            className="w-full border rounded px-2 py-1"
            value={provider}
            onChange={handleProviderChange}
          >
            {PROVIDERS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="smtp-email">Email expéditeur</Label>
          <Input
            id="smtp-email"
            name="email"
            type="email"
            value={config.email}
            onChange={handleChange}
            required
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="smtp-password">Mot de passe SMTP</Label>
          <Input
            id="smtp-password"
            name="password"
            type="password"
            value={config.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            placeholder="Entrer le mot de passe SMTP"
          />
        </div>
        <div>
          <Label htmlFor="smtp-host">Host SMTP</Label>
          <Input
            id="smtp-host"
            name="host"
            type="text"
            value={config.host}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="smtp-port">Port SMTP</Label>
          <Input
            id="smtp-port"
            name="port"
            type="number"
            value={config.port}
            onChange={handleChange}
            required
            min={1}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Switch
            id="smtp-secure"
            name="secure"
            checked={config.secure}
            onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, secure: checked }))}
          />
          <Label htmlFor="smtp-secure">Connexion sécurisée (SSL/TLS)</Label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button type="button" variant="outline" onClick={handleTest} disabled={testLoading || loading}>
          {testLoading ? 'Test en cours...' : 'Tester l\'envoi'}
        </Button>
      </div>
      {testResult && <div className="text-sm mt-2 text-center text-muted-foreground">{testResult}</div>}
    </form>
  );
};

export default SmtpConfigForm;
