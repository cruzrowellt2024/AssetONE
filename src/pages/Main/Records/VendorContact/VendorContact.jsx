import { useState, useEffect } from "react";
import { fetchVendors } from "../../../../firebase/vendorservices";
import AddVendor from "./AddVendor";
import VendorDetails from "./VendorDetails";

const VendorContact = () => {
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingVendor, setIsAddingVendor] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    const getVendors = async () => {
        try {
            const vendorData = await fetchVendors();
            setVendors(vendorData || []);
        } catch (error) {
            console.error("Error fetching vendors:", error);
            setVendors([]);
        }
    };

    useEffect(() => {
        getVendors();
    }, []);

    useEffect(() => {
        getVendors();
    }, [isAddingVendor]);

    useEffect(() => {
        getVendors();
    }, [selectedVendor]);

    const filteredVendors = vendors.filter((vendor) =>
        [vendor.id, vendor.name, vendor.phoneNumber, vendor.emailAddress, vendor.offers]
            .filter(Boolean)
            .some((value) =>
                value.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
    const paginatedVendors = filteredVendors.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleRowClick = (vendor) => {
        setSelectedVendor(vendor);
    };

    return (
        <div className="table-container">
            <div className="page-table-header">
                <div className="header-top">
                    <h1 className="title">
                        Vendors<span className="table-title-style">{vendors.length}</span>
                    </h1>
                    <input
                        type="text"
                        className="search-bar"
                        style={{ maxWidth: "100%" }}
                        placeholder="Search vendors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="add-data-btn" onClick={() => setIsAddingVendor(true)}>
                        Add Vendor
                    </button>
                </div>

                <table className="header-table">
                    <thead>
                        <tr>
                            <th>Vendor ID</th>
                            <th>Vendor Name</th>
                            <th>Phone Number</th>
                            <th>Email Address</th>
                            <th>Offers</th>
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="table-wrapper">
                <table className="body-table">
                    <tbody>
                        {paginatedVendors.length > 0 ? (
                            paginatedVendors.map((vendor) => (
                                <tr
                                    key={vendor.id}
                                    onClick={() => handleRowClick(vendor)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>{vendor.id}</td>
                                    <td>{vendor.name}</td>
                                    <td>{vendor.phoneNumber}</td>
                                    <td>{vendor.emailAddress}</td>
                                    <td>{vendor.offers}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No vendors found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination-controls">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="pagination-button"
                >
                    Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="pagination-button"
                >
                    Next
                </button>
            </div>

            {isAddingVendor && <AddVendor onClose={() => setIsAddingVendor(false)} />}
            {selectedVendor && <VendorDetails vendorDetails={selectedVendor} onClose={() => setSelectedVendor(null)} />}
        </div>
    );
};

export default VendorContact;