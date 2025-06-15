import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const fetchVendors = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "vendors"));
        const vendorLists = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return vendorLists;
    } catch (error) {
        console.error("Error fetching vendors:", error);
    }
};

const generateVendorID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "vendors"));
        const vendorIds = querySnapshot.docs.map((doc) => doc.id);

        if (vendorIds.length > 0) {
            const highestID = Math.max(...vendorIds.map((id) => parseInt(id.replace("V-", ""))));
            return `V-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "V-00001";
        }
    } catch (error) {
        console.error("Error generating vendor ID:", error);
        return "V-00001";
    }
};

const addVendor = async ( name, description, offers, phoneNumber, emailAddress, contactPerson, address ) => {
    try {
        const vendorID = await generateVendorID();

        await setDoc(doc(db, "vendors", vendorID), {
            name,
            description,
            offers,
            phoneNumber,
            emailAddress,
            contactPerson,
            address,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

    } catch (error) {
        console.error("Error adding vendor:", error);
        throw error;
    }
};

const updateVendor = async (selectedVendor) => {
    if (!selectedVendor) return;

    try {
        await setDoc(doc(db, "vendors", selectedVendor.id), {
            name: selectedVendor.name,
            description: selectedVendor.description,
            offers: selectedVendor.offers,
            phoneNumber: selectedVendor.phoneNumber,
            emailAddress: selectedVendor.emailAddress,
            contactPerson: selectedVendor.contactPerson,
            address: selectedVendor.address,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

    } catch (error) {
        console.error("Error updating vendor:", error);
        throw error;
    }
};

const deleteVendor = async (vendorId) => {
    if (!vendorId) throw new Error("Vendor ID is required");

    try {
        await deleteDoc(doc(db, "vendors", vendorId));
    } catch (error) {
        console.error("Error deleting vendor:", error);
        throw error;
    }
};

const fetchVendorsWithAssetCount = async () => {
    const vendorSnap = await getDocs(collection(db, 'vendors'));
    const assetSnap = await getDocs(collection(db, 'units'));

    const assetList = assetSnap.docs.map(doc => doc.data());
    const vendorList = vendorSnap.docs.map(doc => {
        const vendorId = doc.id;
        const vendorData = doc.data();

        const count = assetList.filter(asset => asset.vendor === vendorId).length;

        return {
            id: vendorId,
            ...vendorData,
            assetCount: count,
        };
    });

    return vendorList;
};

export { fetchVendors, addVendor, updateVendor, deleteVendor, fetchVendorsWithAssetCount };