import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, BookOpen, User as UserIcon } from 'lucide-react';

const subjects =[
  "limba română", "limba rusă", "l. engleză", "matematică", 
  "fizică", "chimia", "biologia", "informatică", "geografia", "istoria"
];

export default function Dashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-xl">
            <BookOpen /> Agenda Electronică
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {dbUser?.name} ({dbUser?.role})</span>
            <button onClick={() => signOut(auth)} className="text-red-500 hover:text-red-600 flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Ieșire
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {dbUser?.role === 'teacher' ? <TeacherView /> : <StudentView />}
      </main>
    </div>
  );
}

function TeacherView() {
  const { dbUser } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const[selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [gradeValue, setGradeValue] = useState<number>(10);
  const[note, setNote] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const querySnapshot = await getDocs(q);
      const studentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentList);
      if(studentList.length > 0) setSelectedStudent(studentList[0].uid);
    }
    fetchStudents();
  },[]);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'grades'), {
        studentId: selectedStudent,
        teacherId: dbUser?.uid,
        subject: selectedSubject,
        value: Number(gradeValue),
        note: note,
        createdAt: new Date().toISOString()
      });
      setStatusMsg('Notă salvată cu succes!');
      setNote(''); setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('A apărut o eroare la salvare!');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Acordă o notă nouă</h2>
      <form onSubmit={handleAddGrade} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Selectează Elevul</span>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="border p-2 rounded-lg bg-white">
            {students.map(st => <option key={st.uid} value={st.uid}>{st.name}</option>)}
          </select>
        </label>
        
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Disciplina</span>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="border p-2 rounded-lg bg-white">
            {subjects.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Nota (1-10)</span>
          <input type="number" min="1" max="10" required value={gradeValue} onChange={e => setGradeValue(parseInt(e.target.value))} className="border p-2 rounded-lg outline-none" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Observație (Opțional)</span>
          <input type="text" placeholder="ex: Prezentare excelentă" value={note} onChange={e => setNote(e.target.value)} className="border p-2 rounded-lg outline-none" />
        </label>

        <div className="md:col-span-2 mt-4 flex items-center justify-between">
          <p className={`font-semibold ${statusMsg.includes('succes') ? 'text-green-600' : 'text-red-500'}`}>{statusMsg}</p>
          <button type="submit" className="bg-primary-600 text-white px-8 py-2 rounded-lg hover:bg-primary-700">Salvează Nota</button>
        </div>
      </form>
    </div>
  );
}

function StudentView() {
  const { dbUser } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    async function fetchGrades() {
      if(!dbUser) return;
      const q = query(collection(db, "grades"), where("studentId", "==", dbUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedGrades = querySnapshot.docs.map(doc => doc.data());
      
      fetchedGrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setGrades(fetchedGrades);
    }
    fetchGrades();
  }, [dbUser]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-slate-100 border-b">
        <h2 className="text-xl font-bold">Catalogul meu - Note recente</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-sm">
              <th className="p-4 border-b">Data</th>
              <th className="p-4 border-b">Disciplina</th>
              <th className="p-4 border-b">Nota</th>
              <th className="p-4 border-b">Observație</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Încă nu ai note introduse în sistem.</td></tr>
            ) : (
              grades.map((grade, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50 transition">
                  <td className="p-4 text-sm">{new Date(grade.createdAt).toLocaleDateString('ro-MD')}</td>
                  <td className="p-4 font-semibold capitalize">{grade.subject}</td>
                  <td className="p-4 text-primary-600 font-bold text-lg">{grade.value}</td>
                  <td className="p-4 text-sm text-slate-600 italic">{grade.note || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}