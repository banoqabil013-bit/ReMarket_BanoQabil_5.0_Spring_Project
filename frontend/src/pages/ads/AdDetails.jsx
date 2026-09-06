import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, MapPin, Tag, Package, User as UserIcon, Trash2, Pencil, Phone } from "lucide-react";
import useApiQuery from "../../hooks/useApiQuery";
import useApiMutation from "../../hooks/useApiMutation";
import { ENDPOINTS } from "../../api/endpoints";
import PublicLayout from "../../layouts/PublicLayout";
import { isTokenValid } from "../../utils/auth";

const placeholderImage =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80";

const AdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = isTokenValid();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [selectedImage, setSelectedImage] = useState(0);

  const { data, isLoading, isError } = useApiQuery(
    ["ad", id],
    ENDPOINTS.ADS.GET_BY_ID(id),
  );

  const deleteMutation = useApiMutation(ENDPOINTS.ADS.DELETE(id), "DELETE", {
    onSuccess: () => navigate("/"),
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      </PublicLayout>
    );
  }

  if (isError) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="text-4xl">😕</p>
          <h1 className="mt-4 text-xl font-bold text-slate-700">Ad Not Found</h1>
          <Link to="/" className="mt-4 inline-block text-violet-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const ad = data?.ad || data?.data || data;
  const images = ad.images?.length ? ad.images : [{ url: placeholderImage }];

  /* Does the logged-in user own this ad? */
  const currentUserId = currentUser?.id || currentUser?._id;
  const adUserId = typeof ad?.user === "object" ? ad.user?._id || ad.user?.id : ad?.user;
  const isOwner =
    isLoggedIn &&
    Boolean(currentUserId) &&
    Boolean(adUserId) &&
    String(currentUserId) === String(adUserId);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this ad?")) {
      deleteMutation.mutate();
    }
  };

  const handleContact = () => {
    if (!isLoggedIn) navigate("/login");
    else alert(`Contact ${ad.user?.name || "the seller"} — messaging feature coming soon!`);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* ── Images ── */}
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                <div className="aspect-[4/3] w-full bg-slate-100">
                  <img
                    src={images[selectedImage]?.url}
                    alt={ad.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.src = placeholderImage; }}
                  />
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                        selectedImage === idx
                          ? "border-violet-500 ring-2 ring-violet-200"
                          : "border-transparent hover:border-slate-200"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`thumb-${idx + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.src = placeholderImage; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="space-y-4 lg:col-span-2">
              {/* Status badges */}
              <div className="flex gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  ad.status === "active"
                    ? "bg-green-100 text-green-700"
                    : ad.status === "sold"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {ad.status}
                </span>
                {ad.condition && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {ad.condition}
                  </span>
                )}
              </div>

              {/* Title + Price */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h1 className="text-2xl font-bold text-slate-900">{ad.title}</h1>
                <p className="mt-3 text-3xl font-extrabold text-violet-700">
                  Rs. {Number(ad.price || 0).toLocaleString()}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-violet-500" />
                    {ad.city || "Location N/A"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag size={14} className="text-violet-500" />
                    {ad.category?.name || ad.category || "General"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package size={14} className="text-violet-500" />
                    {ad.condition || "Used"}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Posted on {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "Recently"}
                </p>
              </div>

              {/* Description */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Description</h2>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {ad.description || "No description provided."}
                </p>
              </div>

              {/* Seller info */}
              {ad.user && (
                <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                    {ad.user.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{ad.user.name}</p>
                    <p className="text-xs text-slate-400">
                      <UserIcon size={11} className="mr-1 inline" />
                      Seller
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {isOwner ? (
                <div className="flex gap-3">
                  <Link
                    to={`/ads/${id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white transition hover:bg-violet-700"
                  >
                    <Pencil size={17} /> Edit Ad
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 py-3.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleContact}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 font-bold text-white shadow-md transition hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl"
                >
                  <Phone size={18} />
                  {isLoggedIn ? "Contact Seller" : "Login to Contact Seller"}
                </button>
              )}

              {deleteMutation.isError && (
                <p className="text-sm text-red-500">Failed to delete. Try again.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AdDetails;
