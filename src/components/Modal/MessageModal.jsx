import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const MessageModal = ({ error, message, clearMessages }) => {
  if (!error && !message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center relative">
        {error ? (
          <FiXCircle className="text-red-500 mx-auto text-6xl mb-4" />
        ) : (
          <FiCheckCircle className="text-green-500 mx-auto text-6xl mb-4" />
        )}
        <p className="text-gray-700 text-lg mb-6">
          {error || message}
        </p>
        <button
          className={`w-full py-2 px-4 rounded font-semibold transition ${
            error
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
          onClick={clearMessages}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default MessageModal;