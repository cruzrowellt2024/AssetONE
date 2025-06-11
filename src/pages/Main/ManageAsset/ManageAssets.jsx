import { useState } from "react";
import AssetList from "./AssetList";
import AssetDetails from "./AssetDetails";
import { useAuth } from "../../../context/AuthContext";
import AssetRequestsList from "./RequestedAssets";
import RequestedAssets from "./RequestedAssets";

const ManageAsset = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isOnAssetList, setIsOnAssetList] = useState(true);

  const { profile } = useAuth();

  return (
    <div className="flex flex-col m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-h-[calc(100%-6rem)] rounded-lg shadow-2xl">
      {profile.role !== "finance" ? (
        <>
      {isOnAssetList ? (
        <AssetList
          onClose={() => setIsOnAssetList(false)}
          onSelectAsset={(asset) => {
            setSelectedAsset(asset); // Update selected asset
            setIsOnAssetList(false); // Switch to AssetDetails view
          }}
        />
      ) : (
        <AssetDetails
          assetDetails={selectedAsset} // Pass the selected asset details
          onClose={() => setIsOnAssetList(true)} // Switch back to AssetList view
        />
      )}
        </>
        ) : (
          <RequestedAssets />
        )}
    </div>
  );
};

export default ManageAsset;
