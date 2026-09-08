import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "../../api/endpoints";
import { isTokenValid } from "../../utils/auth";
import api from "../../api/axios";

const placeholderImage =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80";

const AdCard = ({ ad, initialFavorited = false }) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorited);
  const [optimistic, setOptimistic] = useState(initialFavorited);
  const queryClient = useQueryClient();
  const isLoggedIn = isTokenValid();

  if (!ad) return null;

  const image = ad.images?.[0]?.url || placeholderImage;
  const categoryName = ad.category?.name || ad.category || "General";
  const status = ad.status || "active";

  const favMutation = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.FAVORITES.TOGGLE(ad._id)),
    onMutate: () => {
      // Optimistic toggle
      setOptimistic((prev) => !prev);
    },
    onSuccess: (data) => {
      const favorited = data?.data?.favorited ?? !isFavorite;
      setIsFavorite(favorited);
      setOptimistic(favorited);
      // Invalidate favorites page cache
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
    onError: () => {
      // Revert optimistic on error
      setOptimistic(isFavorite);
    },
  });

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    favMutation.mutate();
  };

  return (
    <Link
      to={`/ads/${ad._id}`}
      className="group relative block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/50"
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={ad.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={optimistic ? "Remove from favorites" : "Add to favorites"}
          title={isLoggedIn ? (optimistic ? "Remove from favorites" : "Save to favorites") : "Login to save"}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:scale-110 hover:bg-white active:scale-95"
        >
          <Heart
            size={16}
            className={`transition-colors ${
              optimistic
                ? "fill-rose-500 text-rose-500"
                : "text-slate-600 hover:text-rose-500"
            }`}
          />
        </button>

        {/* SOLD diagonal ribbon */}
        {status === "sold" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rotate-[-35deg] rounded-lg bg-sky-600 px-8 py-1.5 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg">
              SOLD
            </span>
          </div>
        )}

        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm ${
            status === "active"
              ? "bg-emerald-500/90 text-white"
              : status === "sold"
                ? "bg-sky-500/90 text-white"
                : "bg-slate-500/90 text-white"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-medium text-indigo-700">
            {categoryName}
          </span>

          <span className="text-xs text-gray-500">
            {ad.condition || "Used"}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-lg font-bold text-gray-900">
            {ad.title}
          </h3>

          <p className="mt-2 text-2xl font-bold text-indigo-600">
            Rs. {Number(ad.price || 0).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{ad.city || "Unknown city"}</span>

          <span>
            {ad.createdAt
              ? new Date(ad.createdAt).toLocaleDateString()
              : "Recently"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
