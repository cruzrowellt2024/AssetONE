import { useState, useEffect } from "react";
import { fetchDepartments } from "../../../../firebase/departmentservices";
import AddDepartment from "./AddDepartment";
import DepartmentDetails from "./DepartmentDetails";
import { FiPlus } from "react-icons/fi";

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingDepartment, setIsAddingDepartment] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    const getDepartments = async () => {
        try {
            const departmentData = await fetchDepartments();
            setDepartments(departmentData || []);
        } catch (error) {
            console.error("Error fetching departments:", error);
            setDepartments([]);
        }
    };

    useEffect(() => {
        getDepartments();
    }, []);

    useEffect(() => {
        getDepartments();
    }, [isAddingDepartment]);

    useEffect(() => {
        getDepartments();
    }, [selectedDepartment]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        document.querySelector('.table-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const filteredData = departments.filter((department) =>
        [department.name, department.description]
            .filter(Boolean)
            .some((value) =>
                value.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const pageNumbersToShow = 5; // Number of page buttons to show
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
        <div className="table-container">
            <div className="page-table-header">
                <div className="header-top">
                    <h1 className="title">Department List<span className="table-title-style">{departments.length}</span></h1>
                    <input
                        type="text"
                        className="search-bar"
                        style={{ maxWidth: "100%" }}
                        placeholder="Search departments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="add-data-btn" onClick={() => setIsAddingDepartment(true)}><FiPlus /> Add Department</button>
                </div>

                <table className="header-table">
                    <thead>
                        <tr>
                            <th>Department ID</th>
                            <th>Department Name</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="table-wrapper">
                <table className="body-table">
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((department) => (
                                <tr key={department.id} onClick={() => setSelectedDepartment(department)}>
                                    <td>{department.id}</td>
                                    <td>{department.name}</td>
                                    <td>{department.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">No Department found</td>
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

                {currentPage > halfPageRange + 1 && (
                    <>
                        <button onClick={() => setCurrentPage(1)} className="pagination-button">1</button>
                        <span>...</span>
                    </>
                )}

                {pageButtons.map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ))}

                {currentPage < totalPages - halfPageRange && (
                    <>
                        <span>...</span>
                        <button onClick={() => setCurrentPage(totalPages)} className="pagination-button">{totalPages}</button>
                    </>
                )}

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="pagination-button"
                >
                    Next
                </button>
            </div>

            {isAddingDepartment && <AddDepartment onClose={() => setIsAddingDepartment(false)} />}
            {selectedDepartment && <DepartmentDetails departmentDetails={selectedDepartment} onClose={() => setSelectedDepartment(null)} />}
        </div>
    );
};

export default Departments;