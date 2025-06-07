import { FiAlertCircle } from "react-icons/fi";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    if (!message) return null;

    return (
        <div className="message-modal-overlay">
            <div className="message-modal-box">
                <FiAlertCircle className="message-modal-warning" style={{ fontSize: "5rem" }} />
                <p className="message-modal-text">{message}</p>
                <div className="message-modal-actions">
                    <button className="message-modal-button confirm-error" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="message-modal-button confirm-message" style={{marginLeft:"10px"}} onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;