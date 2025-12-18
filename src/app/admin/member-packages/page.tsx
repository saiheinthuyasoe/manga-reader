"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

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

  const handleOpenModal = () => {
    setForm({ name: "", price: "", duration: "" });
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError("");
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      await addDoc(collection(db, "memberPackages"), {
        name: form.name,
        price: Number(form.price),
        duration: Number(form.duration),
      });
      setShowModal(false);
      setForm({ name: "", price: "", duration: "" });
      fetchPackages();
    } catch (err) {
      setError("Failed to add package.");
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
        <table className="w-full text-left">
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
                <td className="py-3">{pkg.price.toLocaleString()} MMK</td>
                <td className="py-3">{pkg.duration}</td>
                <td className="py-3">
                  <button className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-semibold mr-2">
                    Edit
                  </button>
                  <button className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6">
          <button
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
            onClick={handleOpenModal}
          >
            Add New Package
          </button>
        </div>

        {/* Modal for adding new package */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">
                Add Member Package
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
                    type="text"
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
                    {submitting ? "Adding..." : "Add Package"}
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
