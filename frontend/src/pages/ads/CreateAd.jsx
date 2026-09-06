import { Link } from "react-router-dom";
import AdForm from "../../components/ads/AdForm";

const CreateAd = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/ads"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Ads
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Post Your Ad
          </h1>

          <p className="mt-2 text-gray-500">
            Sell your product quickly by creating a great listing.
          </p>
        </div>

        <AdForm />
      </div>
    </div>
  );
};

export default CreateAd;
