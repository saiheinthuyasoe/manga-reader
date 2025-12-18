"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CoinPackage } from "@/types/coin-package";
import Link from "next/link";

export default function CoinPackageAdminPage() {
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [editing, setEditing] = useState<CoinPackage | null>(null);
  const [form, setForm] = useState({ name: "", coins: 0, price: 0 });

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "coinPackages"), (snapshot) => {
      setCoinPackages(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as CoinPackage)
        )
      );
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, "coinPackages"), {
      name: form.name,
      coins: form.coins,
      price: form.price,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setForm({ name: "", coins: 0, price: 0 });
  };

  const handleEdit = (pkg: CoinPackage) => {
    setEditing(pkg);
    setForm({ name: pkg.name, coins: pkg.coins, price: pkg.price });
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await updateDoc(doc(db, "coinPackages", editing.id), {
      name: form.name,
      coins: form.coins,
      price: form.price,
      updatedAt: serverTimestamp(),
    });
    setEditing(null);
    setForm({ name: "", coins: 0, price: 0 });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "coinPackages", id));
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-2 sm:px-6 pt-20 pb-28 sm:pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <span className="inline-block w-2 h-6 bg-blue-500 rounded-sm mr-2" />
          Coin Package Management
        </h1>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Card */}
        <div className="bg-zinc-900 rounded-xl shadow border border-zinc-800 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-1.5 h-5 bg-green-500 rounded-sm" />
            <h2 className="font-semibold text-lg text-zinc-100">
              {editing ? "Edit" : "Add"} Coin Package
            </h2>
          </div>
          <form
            className="flex flex-col gap-4 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              editing ? handleUpdate() : handleAdd();
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Name</label>
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Coins</label>
              <input
                type="number"
                placeholder="Coins"
                value={form.coins}
                onChange={(e) =>
                  setForm({ ...form, coins: Number(e.target.value) })
                }
                className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Price (MMK)</label>
              <input
                type="number"
                placeholder="Price (MMK)"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0.01}
                step={0.01}
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              {editing ? (
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold shadow"
                >
                  Update
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold shadow"
                >
                  Add
                </button>
              )}
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: "", coins: 0, price: 0 });
                  }}
                  className="ml-2 text-zinc-400 hover:text-white border border-zinc-600 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        {/* Table Card */}
        <div className="bg-zinc-900 rounded-xl shadow border border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-1.5 h-5 bg-blue-500 rounded-sm" />
            <h2 className="font-semibold text-lg text-zinc-100">
              Coin Packages
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-zinc-800">
                  <th className="py-3 px-4 rounded-l-lg">Name</th>
                  <th className="py-3 px-4">Coins</th>
                  <th className="py-3 px-4">Price (MMK)</th>
                  <th className="py-3 px-4 rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coinPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-zinc-800 transition">
                    <td className="py-2 px-4 font-medium text-zinc-100">
                      {pkg.name}
                    </td>
                    <td className="py-2 px-4 text-zinc-200">{pkg.coins}</td>
                    <td className="py-2 px-4 text-zinc-200">
                      {pkg.price.toLocaleString()} MMK
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="text-blue-400 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="text-red-400 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {coinPackages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-zinc-500 py-6 text-center">
                      No coin packages yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
