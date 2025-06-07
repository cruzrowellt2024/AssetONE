import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from './activtylogservices';

const fetchLocations = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const locationList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return locationList;
    } catch (error) {
        console.error("Error fetching locations:", error);
    }
};

const generateLocationID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const locationIds = querySnapshot.docs.map((doc) => doc.id);

        if (locationIds.length > 0) {
            const highestID = Math.max(...locationIds.map((id) => parseInt(id.replace("L-", ""))));
            return `L-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "L-00001";
        }
    } catch (error) {
        console.error("Error generating location ID:", error);
        return "L-00001";
    }
};

const addLocation = async (name, address, description, logby) => {
    try {
        const locationID = await generateLocationID();

        await setDoc(doc(db, "locations", locationID), {
            name,
            address,
            description,
            status: "Available",
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Location", `Location ID: ${locationID}`);
    } catch (error) {
        console.error("Error adding location:", error);
        throw error;
    }
};

const updateLocation = async (selectedLocation, logby) => {
    if (!selectedLocation) return;

    try {
        await setDoc(doc(db, "locations", selectedLocation.id), {
            name: selectedLocation.name,
            address: selectedLocation.address,
            status: selectedLocation.status,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Location", `Location ID: ${selectedLocation.id}`);
    } catch (error) {
        console.error("Error updating location:", error);
        throw error;
    }
};

const deleteLocation = async (locationId, logby) => {
    if (!locationId) throw new Error("Location ID is required");

    try {
        await deleteDoc(doc(db, "locations", locationId));
        await addActivityLog(logby, "Delete Location", `Location ID: ${locationId}`);
    } catch (error) {
        console.error("Error deleting location:", error);
        throw error;
    }
};

const fetchLocationsWithAssetCount = async () => {
    const locationSnap = await getDocs(collection(db, 'locations'));
    const assetSnap = await getDocs(collection(db, 'assets'));

    const assetList = assetSnap.docs.map(doc => doc.data());
    const locationList = locationSnap.docs.map(doc => {
        const locationId = doc.id;
        const locationData = doc.data();

        const count = assetList.filter(asset => asset.location === locationId).length;

        return {
            id: locationId,
            ...locationData,
            assetCount: count,
        };
    });

    return locationList;
};

export { addLocation, fetchLocations, updateLocation, deleteLocation, fetchLocationsWithAssetCount };