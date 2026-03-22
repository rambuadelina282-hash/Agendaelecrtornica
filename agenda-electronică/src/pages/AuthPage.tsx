import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const[name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: userCred.user.email,
          name: name,
          role: role
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <BookOpen className="w-12 h-12 text-primary-600 mb-2" />
          <h1 className="text-2xl font-bold">Agenda Electronică</h1>
          <p className="text-slate-500 text-sm">Catalogul școlar online</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Nume și Prenume complet" required value={name} onChange={e => setName(e.target.value)} className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
              <select value={role} onChange={e => setRole(e.target.value as 'student' | 'teacher')} className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="student">Elev</option>
                <option value="teacher">Profesor</option>
              </select>
            </>
          )}
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          <input type="password" placeholder="Parolă" required value={password} onChange={e => setPassword(e.target.value)} className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 rounded-lg transition-colors">
            {isLogin ? 'Autentificare' : 'Creare Cont'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          {isLogin ? "Nu ai cont?" : "Ai deja un cont?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary-600 font-bold hover:underline">
            {isLogin ? 'Înregistrează-te' : 'Conectează-te'}
          </button>
        </p>
      </div>
    </div>
  );
}
