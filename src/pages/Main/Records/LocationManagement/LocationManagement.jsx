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
        document.querySelector('.table-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const filteredLocations = locations.filter((location) =>
        [location.name, location.address]
            .filter(Boolean)
            .some((value) =>
                value.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);
    const paginatedData = filteredLocations.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleRowClick = (location) => {
        setSelectedLocation(location);
    };

    return (
        <div className="table-container">
            <div className="page-table-header">
                <div className="header-top">
                    <h1 className="title">Location List<span className="table-title-style">{locations.length}</span></h1>
                    <input
                        type="text"
                        className="search-bar"
                        style={{ maxWidth: "100%" }}
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="add-data-btn" onClick={() => setIsAddingLocation(true)}><FiPlus /> Add Location</button>
                </div>

                <table className="header-table">
                    <thead>
                        <tr>
                            <th>Location ID</th>
                            <th>Name</th>
                            <th>Address</th>
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="table-wrapper">
                <table className="body-table">
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((location) => (
                                <tr key={location.id} onClick={() => handleRowClick(location)} style={{ cursor: "pointer" }}>
                                    <td>{location.id}</td>
                                    <td>{location.name}</td>
                                    <td>{location.address}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No locations found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination-controls">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="pagination-button"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="pagination-button"
                >
                    Next
                </button>
            </div>

            {isAddingLocation && <AddLocation onClose={() => setIsAddingLocation(false)} />}
            {selectedLocation && <LocationDetails locationDetails={selectedLocation} onClose={() => setSelectedLocation(null)} />}
        </div>
    );
};

export default LocationManagement;