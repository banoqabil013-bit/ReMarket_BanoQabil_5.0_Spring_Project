import { Link, useParams } from "react-router-dom";
import AdForm from "../../components/ads/AdForm";
import useApiQuery from "../../hooks/useApiQuery";
import adService from "../../services/adService";
import { ENDPOINTS } from "../../api/endpoints";

const EditAd = () => {
  const { id } = useParams();

  const { data, isLoading, isError } = useApiQuery(
    ["ad", id],
    ENDPOINTS.ADS.GET_BY_ID(id),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-xl bg-red-50 p-5 text-red-600">
          Failed to load advertisement.
        </div>
      </div>
    );
  }

  const ad = data?.ad || data?.data || data;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to={`/ads/${id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Ad
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Edit Advertisement
          </h1>

          <p className="mt-2 text-gray-500">
            Update your advertisement information.
          </p>
        </div>

        <AdForm ad={ad} isEdit />
      </div>
    </div>
  );
};

export default EditAd;
