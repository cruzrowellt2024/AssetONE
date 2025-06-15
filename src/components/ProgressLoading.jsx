const ProgressLoading = ({ progress, message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-8 border-white border-t-black animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center rounded-full">
          <h1 className="text-7xl font-bold text-white mb-2 select-none">A</h1>
        </div>
      </div>
      <div className="text-white text-lg font-semibold">
        {message || "Loading..."}
      </div>
      <div className="w-64 bg-gray-700 rounded-full h-2 mt-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressLoading;
