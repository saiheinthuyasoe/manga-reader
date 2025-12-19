"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

type MemberPackage = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

export default function MemberPackageAdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [memberPackages, setMemberPackages] = useState<MemberPackage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    price: string;
    duration: string;
  }>({ name: "", price: "", duration: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, loading, router]);

  // Fetch member packages from Firestore
  const fetchPackages = async () => {
    try {
      const colRef = collection(db, "memberPackages");
      const snap = await getDocs(colRef);
      setMemberPackages(
        snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            price: Number(data.price),
            duration: Number(data.duration),
          } as MemberPackage;
        })
      );
    } catch (err) {
      setMemberPackages([]);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (pkg?: MemberPackage) => {
    if (pkg) {
      setEditingId(pkg.id);
      setForm({
        name: pkg.name,
        price: pkg.price.toString(),
        duration: pkg.duration.toString(),
      });
    } else {
      setEditingId(null);
      setForm({ name: "", price: "", duration: "" });
    }
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError("");
    setEditingId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      await deleteDoc(doc(db, "memberPackages", id));
      fetchPackages();
    } catch (err) {
      alert("Failed to delete package.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    if (!form.name || !form.price || !form.duration) {
      setError("All fields are required.");
      setSubmitting(false);
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, "memberPackages", editingId), {
          name: form.name,
          price: Number(form.price),
          duration: Number(form.duration),
        });
      } else {
        await addDoc(collection(db, "memberPackages"), {
          name: form.name,
          price: Number(form.price),
          duration: Number(form.duration),
        });
      }
      setShowModal(false);
      setForm({ name: "", price: "", duration: "" });
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      setError("Failed to save package.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Crown className="w-6 h-6 text-yellow-400" /> Member Packages
      </h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
          {memberPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-white text-lg">
                  {pkg.name}
                </span>
                <span className="text-yellow-400 font-bold">
                  {pkg.price.toLocaleString()} MMK
                </span>
              </div>
              <div className="text-zinc-400 text-sm">
                Duration: {pkg.duration} days
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleOpenModal(pkg)}
                  className="flex-1 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="flex-1 px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <table className="hidden md:table w-full text-left">
          <thead>
            <tr className="text-zinc-400">
              <th className="py-2">Name</th>
              <th className="py-2">Price (MMK)</th>
              <th className="py-2">Duration</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {memberPackages.map((pkg) => (
              <tr key={pkg.id} className="border-t border-zinc-800">
                <td className="py-3 font-semibold text-white">{pkg.name}</td>
                <td className="py-3">{isNaN(pkg.price) ? "N/A" : `${pkg.price.toLocaleString()} MMK`}</td>
                <td className="py-3">{isNaN(pkg.duration) ? "N/A" : `${pkg.duration} days`}</td>
                <td className="py-3">
                  <button
                    onClick={() => handleOpenModal(pkg)}
                    className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-semibold mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6">
          <button
            className="w-full md:w-auto px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
            onClick={() => handleOpenModal()}
          >
            Add New Package
          </button>
        </div>

        {/* Modal for adding/editing package */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">
                {editingId ? "Edit Member Package" : "Add Member Package"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Name</label>
                  <input
                    title="Name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Price (MMK)
                  </label>
                  <input
                    title="Price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Duration</label>
                  <input
                    title="Duration"
                    type="number"
                    name="duration"
                    value={form.duration}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    required
                  />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                      ? "Update Package"
                      : "Add Package"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white rounded-lg font-semibold"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
