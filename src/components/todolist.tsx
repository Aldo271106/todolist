'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(task.deadline).toISOString().slice(0, 16)}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = { ...task, text: formValues[0], deadline: formValues[1] };
      await updateDoc(doc(db, 'tasks', task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });
      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const filteredTasks = tasks.filter((task) =>
    task.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-red-900 py-10 px-4 text-white">
      <div className="max-w-xl mx-auto px-6 py-8 bg-gray-900 rounded-2xl shadow-2xl border border-red-800">
        <h1 className="text-4xl font-bold text-center text-red-500 mb-6 drop-shadow-lg">
          ☠️ Daftar Tugas Maut ☠️
        </h1>

        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="🔍 Cari tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="absolute top-3 left-3 text-red-400">🔍</div>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={addTask}
            className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-transform hover:scale-105"
          >
            ➕ Tambah Tugas
          </button>
        </div>

        <ul className="space-y-4">
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const timeLeft = calculateTimeRemaining(task.deadline);
              const isExpired = timeLeft === 'Waktu habis!';

              let taskColor = '';
              if (isExpired) {
                taskColor = 'border-red-800 bg-red-950';
              } else if (task.completed) {
                taskColor = 'border-gray-700 bg-gray-800';
              } else {
                taskColor = 'border-purple-800 bg-purple-900';
              }

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-xl border-l-4 ${taskColor} shadow-md text-white`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3
                        onClick={() => toggleTask(task.id)}
                        className={`text-lg font-semibold cursor-pointer ${
                          task.completed ? 'line-through text-gray-400' : 'text-white'
                        }`}
                      >
                        {task.completed ? '✔️' : isExpired ? '❌' : '⚠️'} {task.text}
                      </h3>
                      <p className="text-sm text-red-300">
                        Deadline: {new Date(task.deadline).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-rose-500 mt-1">
                        ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(task)}
                        className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded-lg text-sm shadow-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-rose-800 hover:bg-rose-900 text-white px-3 py-1 rounded-lg text-sm shadow-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
