import { useEffect } from "react";
import PropTypes from "prop-types";
import { FiArrowLeft, FiCheckSquare, FiTrash } from "react-icons/fi";

const Modal = ({ children, onClose, title, closeOnBackdropClick = true, onDelete, onSave }) => {
    const handleBackdropClick = (e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const modalContainer = document.querySelector(".modal-container");
        modalContainer && modalContainer.focus();
    }, []);

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-container" role="dialog" aria-labelledby="modal-title" tabIndex="-1">
                <div className="modal-header">
                    <div className="modal-header-left">
                        <FiArrowLeft className="back-btn" onClick={onClose} />
                        <h3>{title}</h3>
                    </div>
                    <div className="modal-header-right">
                        <FiTrash className="delete-btn" onClick={onDelete} />
                        <div className="update-btn" onClick={onSave}>
                            <span>Save Changes</span>
                            <FiCheckSquare className="btn-save-icon" />
                        </div>
                    </div>
                </div>
                <div className="modal-contents" onClick={(e) => e.stopPropagation()}>{children}</div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    closeOnBackdropClick: PropTypes.bool,
    onDelete: PropTypes.func,
    onSave: PropTypes.func,
};

export default Modal;