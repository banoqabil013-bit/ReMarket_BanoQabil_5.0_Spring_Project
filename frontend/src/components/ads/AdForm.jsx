import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Image as ImageIcon, MapPin } from "lucide-react";
import { ENDPOINTS } from "../../api/endpoints";
import useApiMutation from "../../hooks/useApiMutation";
import useApiQuery from "../../hooks/useApiQuery";
import { getLiveLocation, getCachedCity } from "../../utils/location";

const initialState = {
  title: "",
  description: "",
  category: "",
  price: "",
  condition: "Used",
  city: "",
  status: "active",
};

const SelectedImagePreview = ({ file, onRemove }) => {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-400">
          <ImageIcon size={24} />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-90 shadow-md transition hover:scale-110 hover:opacity-100"
      >
        <X size={14} />
      </button>
      <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded bg-black/60 px-1.5 py-0.5 text-center text-[10px] text-white">
        {file.name}
      </span>
    </div>
  );
};

const AdForm = ({ ad, isEdit = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [fileError, setFileError] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: categoriesData, isLoading: categoriesLoading } = useApiQuery(
    ["categories"],
    ENDPOINTS.CATEGORY.GET_ALL,
  );

  const categories = categoriesData?.categories || categoriesData?.data || [];

  const createMutation = useApiMutation(ENDPOINTS.ADS.CREATE, "POST", {
    onSuccess: () => {
      navigate("/my-ads");
    },
  });

  const updateMutation = useApiMutation(
    ENDPOINTS.ADS.UPDATE(ad?._id || ad?.id),
    "PUT",
    {
      onSuccess: () => {
        navigate(`/ads/${ad?._id || ad?.id}`);
      },
    },
  );

  useEffect(() => {
    if (ad) {
      setFormData({
        title: ad.title || "",
        description: ad.description || "",
        category: ad.category?._id || ad.category || "",
        price: ad.price || "",
        condition: ad.condition || "Used",
        city: ad.city || "",
        status: ad.status || "active",
      });
      if (Array.isArray(ad.images)) {
        setExistingImages(ad.images);
      }
    } else {
      // For new ads: pre-fill with cached or auto-detected city if empty
      const cached = getCachedCity();
      if (cached) {
        setFormData((prev) => (prev.city ? prev : { ...prev, city: cached }));
      } else {
        getLiveLocation().then((res) => {
          if (res.success && res.city) {
            setFormData((prev) => (prev.city ? prev : { ...prev, city: res.city }));
          }
        });
      }
    }
  }, [ad]);

  const handleDetectCity = async () => {
    setIsDetectingLocation(true);
    try {
      const res = await getLiveLocation();
      if (res.success && res.city) {
        setFormData((prev) => ({ ...prev, city: res.city }));
        setErrors((prev) => ({ ...prev, city: "" }));
      }
    } catch (err) {
      console.error("Location detection error:", err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (!newFiles.length) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidFormat = newFiles.find((file) => !allowedTypes.includes(file.type));
    if (invalidFormat) {
      setFileError("Only JPG, JPEG, PNG, and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    const oversized = newFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setFileError("Each image must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    const currentTotal = existingImages.length + selectedFiles.length;
    const availableSlots = 5 - currentTotal;

    if (availableSlots <= 0) {
      setFileError("Maximum 5 images allowed per ad.");
      event.target.value = "";
      return;
    }

    setFileError("");

    if (newFiles.length > availableSlots) {
      setFileError(`You can only select up to 5 images in total. Added the first ${availableSlots} image(s).`);
      setSelectedFiles((prev) => [...prev, ...newFiles.slice(0, availableSlots)]);
    } else {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }

    // Reset input so user can click and select more files repeatedly
    event.target.value = "";
  };

  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFileError("");
  };

  const removeExistingImage = (publicId) => {
    setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId));
    setRemovedImages((prev) => [...prev, publicId]);
    setFileError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (!formData.category) {
      nextErrors.category = "Please select a category.";
    }

    if (!formData.price || Number(formData.price) <= 0) {
      nextErrors.price = "Price must be greater than 0.";
    }

    if (!formData.condition) {
      nextErrors.condition = "Please select a condition.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        payload.append(key, value);
      }
    });

    selectedFiles.forEach((file) => {
      payload.append("images", file);
    });

    if (isEdit) {
      removedImages.forEach((publicId) => {
        payload.append("removedImages", publicId);
      });
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isSubmitting = isEdit ? updateMutation.isPending : createMutation.isPending;
  const errorMessage = isEdit
    ? updateMutation.error?.response?.data?.message
    : createMutation.error?.response?.data?.message;

  const totalImages = existingImages.length + selectedFiles.length;
  const canAddMore = totalImages < 5;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
      encType="multipart/form-data"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 ${
              errors.title ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="e.g. Apple iPhone 13 Pro"
          />
          {errors.title && (
            <p className="mt-2 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 ${
              errors.description ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="Describe your product in detail"
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category
          </label>

          {categoriesLoading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Loading categories...
            </div>
          ) : (
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 ${
                errors.category ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id || category.id} value={category._id || category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {errors.category && (
            <p className="mt-2 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 ${
              errors.price ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="25000"
          />
          {errors.price && (
            <p className="mt-2 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Condition
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 ${
              errors.condition ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select condition</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Used">Used</option>
          </select>
          {errors.condition && (
            <p className="mt-2 text-sm text-red-600">{errors.condition}</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <button
              type="button"
              onClick={handleDetectCity}
              disabled={isDetectingLocation}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              title="Detect live location"
            >
              <MapPin size={12} className={isDetectingLocation ? "animate-bounce" : ""} />
              {isDetectingLocation ? "Detecting..." : "📍 Auto-Detect"}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 pr-10 outline-none transition focus:border-indigo-500 ${
                errors.city ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="e.g. Lahore, Karachi, Islamabad"
            />
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin size={16} />
            </div>
          </div>
          {errors.city && (
            <p className="mt-2 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500"
          >
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Images <span className="text-xs font-normal text-gray-500">(Max 5 images)</span>
            </label>
            <span
              className={`text-xs font-medium ${
                totalImages >= 5 ? "font-semibold text-amber-600" : "text-gray-500"
              }`}
            >
              {totalImages} of 5 selected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {/* Existing images in edit mode */}
            {existingImages.map((img) => (
              <div
                key={img.public_id || img.url}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm"
              >
                <img
                  src={img.url}
                  alt="Existing ad"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.public_id)}
                  aria-label="Remove image"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-90 shadow-md transition hover:scale-110 hover:opacity-100"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded bg-black/60 px-1.5 py-0.5 text-center text-[10px] text-white">
                  Existing
                </span>
              </div>
            ))}

            {/* Newly selected images */}
            {selectedFiles.map((file, idx) => (
              <SelectedImagePreview
                key={`${file.name}-${idx}-${file.lastModified}`}
                file={file}
                onRemove={() => removeSelectedFile(idx)}
              />
            ))}

            {/* Upload Button Box if slots available */}
            {canAddMore && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-2 text-center transition hover:border-indigo-500 hover:bg-indigo-50/40">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Upload size={20} />
                </div>
                <span className="mt-2 text-xs font-semibold text-gray-700">Add Images</span>
                <span className="mt-0.5 text-[10px] text-gray-400">
                  {5 - totalImages} slot{5 - totalImages === 1 ? "" : "s"} left
                </span>
              </label>
            )}
          </div>

          {fileError && (
            <p className="mt-2 text-sm text-red-600">{fileError}</p>
          )}

          <p className="mt-2 text-xs text-gray-400">
            JPG, PNG or WEBP up to 5MB each. You can select multiple images or add them one by one up to 5 pictures.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? (isEdit ? "Updating..." : "Publishing...") : isEdit ? "Update Ad" : "Publish Ad"}
        </button>
      </div>
    </form>
  );
};

export default AdForm;
