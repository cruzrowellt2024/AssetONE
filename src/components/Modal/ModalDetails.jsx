import { useEffect } from "react";
import PropTypes from "prop-types";
import { FiArrowLeft, FiCheckSquare, FiTrash } from "react-icons/fi";

const Modal = ({
  children,
  onClose,
  title,
  closeOnBackdropClick = true,
  onDelete,
  onSave,
}) => {
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="modal-container bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col outline-none"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <FiArrowLeft
              className="cursor-pointer hover:text-gray-300 transition"
              onClick={onClose}
            />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-gray-200 hover:text-gray-300 px-4 py-3 lg:py-2 rounded bg-red-600 hover:bg-red-500 transition flex items-center gap-2"
              onClick={onDelete}
              title="Delete"
            >
              <FiTrash />
              <span className="hidden lg:inline">Delete</span>
            </button>
            <button
              className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
              onClick={onSave}
              title="Save Changes"
            >
              <FiCheckSquare />
              <span className="hidden lg:inline">Save</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
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
