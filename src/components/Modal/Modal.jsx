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
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container" role="dialog" aria-labelledby="modal-title" tabIndex="-1" style={{maxWidth:"300px"}}>
        <div className="modal-headers">
          <h2 id="modal-title">{title}</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-contents">{children}</div>
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