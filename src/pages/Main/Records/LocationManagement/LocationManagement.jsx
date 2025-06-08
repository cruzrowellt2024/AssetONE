import { useState, useEffect } from "react";
import { fetchLocations } from "../../../../firebase/locationservices";
import AddLocation from "./AddLocation";
import LocationDetails from "./LocationDetails";
import { FiPlus } from "react-icons/fi";

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const getLocations = async () => {
    try {
      const locationData = await fetchLocations();
      setLocations(locationData || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
    }
  };

  useEffect(() => {
    getLocations();
  }, []);

  useEffect(() => {
    getLocations();
  }, [isAddingLocation]);

  useEffect(() => {
    getLocations();
  }, [selectedLocation]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    document
      .querySelector(".table-wrapper")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const filteredLocations = locations.filter((location) =>
    [location.name, location.address]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);
  const paginatedData = filteredLocations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pageNumbersToShow = 5;
  const halfPageRange = Math.floor(pageNumbersToShow / 2);

  const getPageButtons = () => {
    const startPage = Math.max(currentPage - halfPageRange, 1);
    const endPage = Math.min(currentPage + halfPageRange, totalPages);

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const pageButtons = getPageButtons();

  return (
    <div className="flex flex-col m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-h-[calc(100%-6rem)] rounded-lg shadow-2xl">
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-0">
            Location List
            <span className="ml-4 text-gray-300">{locations.length}</span>
          </h1>
          <input
            type="text"
            className="order-2 min-w-[120px] max-w-[200px] flex-grow rounded-md border-none px-2 py-1 text-black"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="hidden sm:flex order-4 rounded-md bg-gray-800 px-3 py-1 text-white hover:bg-gray-900 items-center gap-1"
            onClick={() => setIsAddingLocation(true)}
          >
            <FiPlus /> Add Location
          </button>

          {/* Floating button for mobile */}
          <button
            onClick={() => setIsAddingLocation(true)}
            className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700 sm:hidden"
            aria-label="Add Vendor"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <table className="w-full border-collapse text-white mt-5">
          <thead>
            <tr>
              <th className="w-[25%] text-start">Name</th>
              <th className="w-[75%] text-start">Address</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-grow overflow-y-auto bg-white px-4 rounded-b-lg">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((location) => (
                <tr
                  key={location.id}
                  onClick={() => setSelectedLocation(location)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td className="w-[25%] border-b border-gray-300 py-2 truncate">{location.name}</td>
                  <td className="w-[75%] border-b border-gray-300 py-2 truncate">{location.address}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-3 py-6 text-center text-gray-500">No locations found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="sticky bottom-0 mt-2 flex w-full items-center justify-center gap-2 rounded-b-lg bg-white py-2">
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            {"<<"}
          </button>
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {"<"}
          </button>

          {pageButtons.map((pageNum) => (
            <button
              key={pageNum}
              className={`rounded border px-3 py-1 ${
                pageNum === currentPage
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 hover:bg-gray-200"
              }`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {">"}
          </button>
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            {">>"}
          </button>
        </div>
      )}

      {isAddingLocation && (
        <AddLocation onClose={() => setIsAddingLocation(false)} />
      )}
      {selectedLocation && (
        <LocationDetails
          locationDetails={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default LocationManagement;
