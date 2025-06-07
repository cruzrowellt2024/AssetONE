import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp, query, orderBy, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from "./activtylogservices";

const fetchRequests = async () => {
    try {
        const q = query(collection(db, "requests"), orderBy("priorityScore", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching requests:", error);
        return [];
    }
};

const fetchRequestById = async (id) => {
    try {
        const docRef = doc(db, "requests", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn("No such document found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching request by ID:", error);
        return null;
    }
};

const generateRequestID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "requests"));
        const requestIds = querySnapshot.docs.map((doc) => doc.id);

        if (requestIds.length > 0) {
            const highestID = Math.max(...requestIds.map((id) => parseInt(id.replace("R-", ""))));
            return `R-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "R-00001";
        }
    } catch (error) {
        console.error("Error generating request ID:", error);
        return "R-00001";
    }
};

const addRequest = async (requestType, reportedAsset, description, priorityScore, reportedBy, assetStatus) => {
    try {
        const newRequestID = await generateRequestID();

        await setDoc(doc(db, "requests", newRequestID), {
            requestType,
            reportedAsset,
            description,
            priorityScore,
            reportedBy,
            status: "Pending",
            assetStatus,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(reportedBy, "Add Request", `Request ID: ${newRequestID}`);
    } catch (error) {
        console.error("Error adding request:", error);
        throw error;
    }
};

const updateRequest = async (selectedRequest, status, logby) => {
    if (!selectedRequest) return;

    try {
        await setDoc(doc(db, "requests", selectedRequest.id), {
            requestType: selectedRequest.requestType,
            reportedAsset: selectedRequest.reportedAsset,
            description: selectedRequest.description,
            priorityScore: selectedRequest.priorityScore,
            reportedBy: selectedRequest.reportedBy,
            status,
            assetStatus: selectedRequest.assetStatus,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Request", `Request ID: ${selectedRequest.id}`);
    } catch (error) {
        console.error("Error updating request:", error);
        throw error;
    }
};

const deleteRequest = async (requestId, logby) => {
    if (!requestId) throw new Error("Request ID is required");

    try {
        await deleteDoc(doc(db, "requests", requestId));
        await addActivityLog(logby, "Delete Request", `Request ID: ${requestId}`);
    } catch (error) {
        console.error("Error deleting request:", error);
        throw error;
    }
};

export { fetchRequests, addRequest, updateRequest, deleteRequest, fetchRequestById };
