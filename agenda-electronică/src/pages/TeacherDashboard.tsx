import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const SUBJECTS = [
  'limba română', 'limba rusă', 'l. engleză', 'matematică',
  'fizică', 'chimia', 'biologia', 'informatică', 'geografia', 'istoria'
];

interface Student {
  uid: string;
  name: string;
  email: string;
}

export default function TeacherDashboard() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [grade, setGrade] = useState<number>(10);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        const studentsList: Student[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          studentsList.push({ uid: data.uid, name: data.name, email: data.email });
        });
        setStudents(studentsList);
        if (studentsList.length > 0) {
          setSelectedStudent(studentsList[0].uid);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Nu s-au putut încărca elevii.");
      }
    };

    fetchStudents();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !userProfile) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const gradeData: any = {
        studentId: selectedStudent,
        teacherId: userProfile.uid,
        subject: subject,
        value: grade,
        createdAt: serverTimestamp()
      };
      
      if (note.trim()) {
        gradeData.note = note.trim();
      }

      await addDoc(collection(db, 'grades'), gradeData);
      setSuccess('Nota a fost adăugată cu succes!');
      setNote('');
      setGrade(10);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error("Error adding grade:", err);
      setError('A apărut o eroare la adăugarea notei.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Panou Profesor</h1>
              <p className="text-xs text-slate-500">{userProfile?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
            <LogOut className="h-4 w-4 mr-2" />
            Deconectare
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-xl font-semibold text-slate-800">Adăugare Notă</h2>
            <p className="text-sm text-slate-500 mt-1">Selectați elevul și materia pentru a adăuga o notă în catalog.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-md text-sm border border-emerald-100 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="student">Elev</Label>
                <select
                  id="student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  required
                >
                  {students.length === 0 && <option value="">Nu există elevi înregistrați</option>}
                  {students.map((student) => (
                    <option key={student.uid} value={student.uid}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Materie</Label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  required
                >
                  {SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notă (1-10)</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGrade(num)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                      grade === num 
                        ? 'bg-indigo-600 text-white shadow-md transform scale-110' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Notă informativă / Observație (opțional)</Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none"
                placeholder="Adăugați un comentariu pentru elev..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button type="submit" className="w-full md:w-auto" disabled={loading || !selectedStudent}>
                {loading ? 'Se salvează...' : 'Salvează Nota'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
