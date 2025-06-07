import { useState, useEffect } from "react";
import { fetchTitles } from "../../../../firebase/usertitleservices";
import AddTitle from "./AddTitle";
import TitleDetails from "./TitleDetails";
import { FiPlus } from "react-icons/fi";

const UserTitle = () => {
    const [titles, setTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingTitle, setIsAddingTitle] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    const getTitles = async () => {
        try {
            const titleData = await fetchTitles();
            setTitles(titleData || []);
        } catch (error) {
            console.error("Error fetching titles:", error);
            setTitles([]);
        }
    };

    useEffect(() => {
        getTitles();
    }, []);

    useEffect(() => {
        getTitles();
    }, [isAddingTitle]);

    useEffect(() => {
        getTitles();
    }, [selectedTitle]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        document.querySelector('.table-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const filteredTitles = titles.filter((title) =>
        [title.name, title.description]
            .filter(Boolean)
            .some((value) =>
                value.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const totalPages = Math.ceil(filteredTitles.length / rowsPerPage);
    const paginatedData = filteredTitles.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleRowClick = (title) => {
        setSelectedTitle(title);
    };

    return (
        <div className="table-container">
            <div className="page-table-header">
                <div className="header-top">
                    <h1 className="title">Title List<span className="table-title-style">{titles.length}</span></h1>
                    <input
                        type="text"
                        className="search-bar"
                        style={{ maxWidth: "100%" }}
                        placeholder="Search titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="add-data-btn" onClick={() => setIsAddingTitle(true)}><FiPlus /> Add Title</button>
                </div>

                <table className="header-table">
                    <thead>
                        <tr>
                            <th>Title ID</th>
                            <th>Title Name</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="table-wrapper">
                <table className="body-table">
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((title) => (
                                <tr key={title.id} onClick={() => handleRowClick(title)} style={{ cursor: "pointer" }}>
                                    <td>{title.id}</td>
                                    <td>{title.name}</td>
                                    <td>{title.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">No titles found</td>
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

            {isAddingTitle && <AddTitle onClose={() => setIsAddingTitle(false)} />}
            {selectedTitle && <TitleDetails titleDetails={selectedTitle} onClose={() => setSelectedTitle(null)} />}
        </div>
    );
};

export default UserTitle;