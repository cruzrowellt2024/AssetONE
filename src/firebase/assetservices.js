import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from './activtylogservices';

const fetchAssets = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "assets"));
        const assetList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return assetList;
    } catch (error) {
        console.error("Error fetching assets:", error);
    }
};

const generateAssetID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "assets"));
        const assetIds = querySnapshot.docs.map((doc) => doc.id);

        if (assetIds.length > 0) {
            const highestID = Math.max(...assetIds.map((id) => parseInt(id.replace("A-", ""))));
            return `A-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "A-00001";
        }
    } catch (error) {
        console.error("Error generating asset ID:", error);
        return "A-00001";
    }
};

const addAsset = async (name, description, category, logby) => {
    try {
        const newAssetID = await generateAssetID();

        await setDoc(doc(db, "assets", newAssetID), {
            name,
            description,
            category,
            createdBy: logby,
            updatedBy: logby,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Asset", `Asset ID: ${newAssetID}`);
    } catch (error) {
        console.error("Error adding asset:", error);
        throw error;
    }
};

const updateAsset = async (selectedAsset, logby) => {
    if (!selectedAsset) return;

    try {
        await setDoc(doc(db, "assets", selectedAsset.id), {
            name: selectedAsset.name,
            description: selectedAsset.description,
            category: selectedAsset.category,
            updatedBy: logby,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Asset", `Asset ID: ${selectedAsset.id}`);
    } catch (error) {
        console.error("Error updating asset:", error);
        throw error;
    }
};

const deleteAsset = async (assetId, logby) => {
    if (!assetId) throw new Error("Asset ID is required");

    try {
        await deleteDoc(doc(db, "assets", assetId));
        await addActivityLog(logby, "Delete Asset", `Asset ID: ${assetId}`);
    } catch (error) {
        console.error("Error deleting asset:", error);
        throw error;
    }
};

export { fetchAssets, addAsset, updateAsset, deleteAsset };