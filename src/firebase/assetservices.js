import { addDoc, getDocs, collection, getDoc, setDoc, writeBatch, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
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

const addAsset = async (asset, logby) => {
    try {
        const { 
            name, description, dateAcquired, cost, status, 
            condition, category, department, location, vendor, specs 
        } = asset;

        const assetID = await generateAssetID();

        await setDoc(doc(db, "assets", assetID), {
            name, 
            description,
            dateAcquired,
            cost,
            status,
            condition,
            category,
            department,
            location,
            vendor,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        const specsRef = collection(db, "assets", assetID, "specifications");
        for (const spec of specs) {
            await addDoc(specsRef, spec);
        }

        await addActivityLog(logby, "Add Asset", `Asset ID: ${assetID}`);

    } catch (error) {
        console.error("Error adding asset:", error);
        throw error;
    }
};

const updateAsset = async (selectedAsset, logby) => {
    if (!selectedAsset) return;

    try {
        await setDoc(doc(db, "assets", selectedAsset.id), {
            name: selectedAsset.name ?? "",
            description: selectedAsset.description ?? "",
            dateAcquired: selectedAsset.dateAcquired ?? "",
            cost: selectedAsset.cost ?? 0,
            category: selectedAsset.category ?? "",
            status: selectedAsset.status ?? "Active",
            condition: selectedAsset.condition ?? "Good",
            department: selectedAsset.department ?? "",
            location: selectedAsset.location ?? "",
            vendor: selectedAsset.vendor ?? "",
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

const getAssetNameById = async (assetId) => {
    if (!assetId) throw new Error("Asset ID is required");

    try {
        const assetDoc = await getDoc(doc(db, "assets", assetId));
        if (assetDoc.exists()) {
            return assetDoc.data().name;
        } else {
            throw new Error("Asset not found");
        }
    } catch (error) {
        console.error("Error fetching asset name:", error);
        throw error;
    }
};

const fetchAssetById = async (assetId) => {
    const docRef = doc(db, "assets", assetId);
    const docSnap = await getDoc(docRef);
    console.log(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};
    
const fetchSpecs = async (assetID) => {
    try {
        const querySnapshot = await getDocs(collection(db, "assets", assetID, "specifications"));
        const specs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        specs.sort((a, b) => a.index - b.index);
        return specs;
    } catch (error) {
        console.error("Error fetching specifications:", error);
    }
};

const updateAssetSpecs = async (assetId, newSpecs, userId) => {
    try {
      const specsRef = collection(db, "assets", assetId, "specifications");
      const existingSpecsSnapshot = await getDocs(specsRef);
      const existingSpecs = existingSpecsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      // Create maps for easier comparison
      const existingSpecsMap = new Map(existingSpecs.map(spec => [spec.key, spec]));
      const newSpecsMap = new Map(newSpecs.map(spec => [spec.key, spec]));
  
      // Batch operations
      const batch = writeBatch(db);
  
      // Update modified specs and identify unchanged ones
      for (const [key, newSpec] of newSpecsMap) {
        if (existingSpecsMap.has(key)) {
          const existingSpec = existingSpecsMap.get(key);
          // Only update if value changed
          if (existingSpec.value !== newSpec.value) {
            const specDocRef = doc(specsRef, existingSpec.id);
            batch.update(specDocRef, { value: newSpec.value });
          }
          existingSpecsMap.delete(key); // Remove from map to track remaining
        } else {
          // Add new spec
          const newDocRef = doc(specsRef);
          batch.set(newDocRef, { key, value: newSpec.value });
        }
      }
  
      // Delete specs that no longer exist
      for (const [key, spec] of existingSpecsMap) {
        const specDocRef = doc(specsRef, spec.id);
        batch.delete(specDocRef);
      }
  
      // Update parent asset timestamp
      const assetRef = doc(db, "assets", assetId);
      batch.update(assetRef, {
        dateUpdated: serverTimestamp(),
        lastUpdatedBy: userId
      });
  
      await batch.commit();
  
    } catch (error) {
      console.error("Error updating asset specs:", error);
      throw error;
    }
  };

  const fetchAssetDataById = async (assetId) => {
    const docRef = doc(db, "assets", assetId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("Asset not found in Firestore");
    }
};


export {
    fetchAssets,
    fetchSpecs,
    addAsset,
    updateAsset,
    deleteAsset,
    getAssetNameById,
    fetchAssetById,
    updateAssetSpecs,
    fetchAssetDataById
};