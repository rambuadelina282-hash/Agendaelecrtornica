import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BookOpen } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Verificați-vă adresa de e-mail pentru instrucțiuni de resetare a parolei.');
    } catch (err: any) {
      setError('A apărut o eroare. Verificați dacă adresa de e-mail este corectă.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            Recuperare Parolă
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Introduceți adresa de e-mail pentru a primi un link de resetare.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm text-center">
              {message}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Adresă de e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="nume@exemplu.com"
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Se trimite...' : 'Trimite link de resetare'}
            </Button>
          </div>
          
          <div className="text-center text-sm text-slate-600">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Înapoi la conectare
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
