import { getDocs, collection, getDoc, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from "./activtylogservices";

const fetchPositions = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "positions"));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching positions:", error);
    }
};

const generatePositionID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "positions"));
        const positionIds = querySnapshot.docs.map((doc) => doc.id);

        if (positionIds.length > 0) {
            const highestID = Math.max(...positionIds.map((id) => parseInt(id.replace("P-", ""))));
            return `P-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "P-00001";
        }
    } catch (error) {
        console.error("Error generating position ID:", error);
        return "P-00001";
    }
};

const addPosition = async (name, description, score, logby) => {
    try {
        const newPositionId = await generatePositionID();

        await setDoc(doc(db, "positions", newPositionId), {
            name,
            description,
            score,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Position", `Position ID: ${newPositionId}`);
    } catch (error) {
        console.error("Error adding position:", error);
        throw error;
    }
};

const updatePosition = async (selectedPosition, logby) => {
    if (!selectedPosition) return;

    try {
        await setDoc(doc(db, "positions", selectedPosition.id), {
            name: selectedPosition.name,
            description: selectedPosition.description,
            score: selectedPosition.score,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Position", `Position ID: ${selectedPosition.id}`);
    } catch (error) {
        console.error("Error updating position:", error);
        throw error;
    }
};

const deletePosition = async (positionId, logby) => {
    if (!positionId) throw new Error("Position ID is required");

    try {
        await deleteDoc(doc(db, "positions", positionId));
        await addActivityLog(logby, "Delete Position", `Position ID: ${positionId}`);
    } catch (error) {
        console.error("Error deleting position:", error);
        throw error;
    }
};

const fetchPositionById = async (positionId) => {
    if (!positionId) return { name: "", score: 0 };

    try {
        const docRef = doc(db, "positions", positionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                name: data.name || "",
                score: data.score || 0,
            };
        } else {
            console.warn(`No position found for ID: ${positionId}`);
            return { name: "", score: 0 };
        }
    } catch (err) {
        console.error("Error fetching position:", err);
        return { name: "", score: 0 };
    }
};

export { fetchPositions, addPosition, updatePosition, deletePosition, fetchPositionById };