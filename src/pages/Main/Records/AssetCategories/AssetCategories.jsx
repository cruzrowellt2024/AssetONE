import { useState, useEffect } from "react";
import { fetchCategories } from "../../../../firebase/categoryservices";
import AddCategory from "./AddCategory";
import CategoryDetails from "./CategoryDetails";
import { FiPlus } from "react-icons/fi";

const AssetCategories = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    const getCategories = async () => {
        try {
            const categoryData = await fetchCategories();
            setCategories(categoryData || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        }
    };

    useEffect(() => {
        getCategories();
    }, []);

    useEffect(() => {
        getCategories();
    }, [isAddingCategory]);

    useEffect(() => {
        getCategories();
    }, [selectedCategory]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        document.querySelector('.table-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const filteredCategories = categories.filter((category) =>
        [category.name, category.description]
            .filter(Boolean)
            .some((value) =>
                value.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
    const paginatedData = filteredCategories.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <div className="table-container">
            <div className="page-table-header">
                <div className="header-top">
                    <h1 className="title">Category List<span className="table-title-style">{categories.length}</span></h1>
                    <input
                        type="text"
                        className="search-bar"
                        style={{ maxWidth: "100%" }}
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="add-data-btn" onClick={() => setIsAddingCategory(true)}><FiPlus /> Add Category</button>
                </div>

                <table className="header-table">
                    <thead>
                        <tr>
                            <th>Category ID</th>
                            <th>Category Name</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="table-wrapper">
                <table className="body-table">
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((category) => (
                                <tr key={category.id} onClick={() => setSelectedCategory(category)}>
                                    <td>{category.id}</td>
                                    <td>{category.name}</td>
                                    <td>{category.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">No Category found</td>
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

            {isAddingCategory && <AddCategory onClose={() => setIsAddingCategory(false)} />}
            {selectedCategory && <CategoryDetails categoryDetails={selectedCategory} onClose={() => setSelectedCategory(null)} />}
        </div>
    );
};

export default AssetCategories;