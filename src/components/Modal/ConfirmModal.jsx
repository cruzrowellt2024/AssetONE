import { FiAlertCircle } from "react-icons/fi";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center relative">
        <FiAlertCircle className="text-yellow-500 mx-auto text-6xl mb-4" />
        <p className="text-gray-700 text-lg mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            className="w-1/2 py-2 px-4 rounded font-semibold transition bg-gray-300 hover:bg-gray-400 text-gray-800"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="w-1/2 py-2 px-4 rounded font-semibold transition bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;