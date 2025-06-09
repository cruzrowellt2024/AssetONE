import { useEffect } from "react";
import PropTypes from "prop-types";

const Modal = ({ children, onClose, title, closeOnBackdropClick = true }) => {
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm w-full"
        role="dialog"
        aria-labelledby="modal-title"
        tabIndex="-1"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4 text-gray-700">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  closeOnBackdropClick: PropTypes.bool,
};

export default Modal;