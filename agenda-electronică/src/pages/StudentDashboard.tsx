import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { LogOut, GraduationCap, Info } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface Grade {
  id: string;
  subject: string;
  value: number;
  note?: string;
  createdAt: any;
}

const SUBJECTS = [
  'limba română', 'limba rusă', 'l. engleză', 'matematică',
  'fizică', 'chimia', 'biologia', 'informatică', 'geografia', 'istoria'
];

export default function StudentDashboard() {
  const { userProfile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedNote, setSelectedNote] = useState<{subject: string, value: number, note: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'grades'),
      where('studentId', '==', userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gradesData: Grade[] = [];
      snapshot.forEach((doc) => {
        gradesData.push({ id: doc.id, ...doc.data() } as Grade);
      });
      // Sort client-side to avoid needing a composite index for now
      gradesData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA; // Descending
      });
      setGrades(gradesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching grades:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleLogout = () => {
    signOut(auth);
  };

  // Group grades by subject
  const gradesBySubject: Record<string, Grade[]> = {};
  SUBJECTS.forEach(sub => {
    gradesBySubject[sub] = grades.filter(g => g.subject === sub);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Agenda Elevului</h1>
              <p className="text-xs text-slate-500">{userProfile?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
            <LogOut className="h-4 w-4 mr-2" />
            Deconectare
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBJECTS.map((subject) => {
              const subjectGrades = gradesBySubject[subject] || [];
              
              // Calculate average
              let avg = '-';
              if (subjectGrades.length > 0) {
                const sum = subjectGrades.reduce((acc, curr) => acc + curr.value, 0);
                avg = (sum / subjectGrades.length).toFixed(2);
              }

              return (
                <div key={subject} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 capitalize">{subject}</h3>
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      Medie: {avg}
                    </span>
                  </div>
                  <div className="p-4 flex-grow">
                    {subjectGrades.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {subjectGrades.map((grade) => (
                          <button
                            key={grade.id}
                            onClick={() => grade.note && setSelectedNote({ subject: grade.subject, value: grade.value, note: grade.note })}
                            className={`relative h-12 w-12 rounded-lg flex items-center justify-center text-lg font-bold transition-transform hover:scale-105 ${
                              grade.note 
                                ? 'bg-red-50 text-red-600 border border-red-200 cursor-pointer shadow-sm' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'
                            }`}
                            title={grade.note ? "Apasă pentru a vedea observația" : ""}
                          >
                            {grade.value}
                            {grade.note && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[3rem] text-sm text-slate-400 italic">
                        Nicio notă
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Note Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center text-red-700">
                <Info className="h-5 w-5 mr-2" />
                <h3 className="font-semibold">Observație Profesor</h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center font-bold text-red-600 shadow-sm">
                {selectedNote.value}
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-2 capitalize">{selectedNote.subject}</p>
              <p className="text-slate-700 whitespace-pre-wrap">{selectedNote.note}</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button onClick={() => setSelectedNote(null)} variant="outline">
                Închide
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
