const SpinnerOverlay = ({ logo = "A", show = true }) => {
    if (!show) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-8 border-white border-t-black animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full">
            <h1 className="text-7xl font-bold text-white mb-2 select-none">
              {logo}
            </h1>
          </div>
        </div>
      </div>
    );
  };
  
  export default SpinnerOverlay;  