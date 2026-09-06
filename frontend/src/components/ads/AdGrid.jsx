import AdCard from "./AdCard";

const AdGrid = ({ ads = [] }) => {
  if (!ads.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
        No ads available right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ads.map((ad, index) => (
        <AdCard key={ad._id || ad.id || `${ad.title}-${index}`} ad={ad} />
      ))}
    </div>
  );
};

export default AdGrid;
