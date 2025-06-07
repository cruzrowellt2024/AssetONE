import { getDocs, collection, getDoc, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from "./activtylogservices";

const fetchTitles = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "titles"));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching titles:", error);
    }
};

const generateTitleID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "titles"));
        const titleIds = querySnapshot.docs.map((doc) => doc.id);

        if (titleIds.length > 0) {
            const highestID = Math.max(...titleIds.map((id) => parseInt(id.replace("T-", ""))));
            return `T-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "T-00001";
        }
    } catch (error) {
        console.error("Error generating title ID:", error);
        return "T-00001";
    }
};

const addTitle = async (name, description, score, logby) => {
    try {
        const newTitleId = await generateTitleID();

        await setDoc(doc(db, "titles", newTitleId), {
            name,
            description,
            score,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Title", `Title ID: ${newTitleId}`);
    } catch (error) {
        console.error("Error adding title:", error);
        throw error;
    }
};

const updateTitle = async (selectedTitle, logby) => {
    if (!selectedTitle) return;

    try {
        await setDoc(doc(db, "titles", selectedTitle.id), {
            name: selectedTitle.name,
            description: selectedTitle.description,
            score: selectedTitle.score,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Title", `Title ID: ${selectedTitle.id}`);
    } catch (error) {
        console.error("Error updating title:", error);
        throw error;
    }
};

const deleteTitle = async (titleId, logby) => {
    if (!titleId) throw new Error("Title ID is required");

    try {
        await deleteDoc(doc(db, "titles", titleId));
        await addActivityLog(logby, "Delete Title", `Title ID: ${titleId}`);
    } catch (error) {
        console.error("Error deleting title:", error);
        throw error;
    }
};

const fetchTitleById = async (titleId) => {
    if (!titleId) return { name: "", score: 0 };

    try {
        const docRef = doc(db, "titles", titleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                name: data.name || "",
                score: data.score || 0,
            };
        } else {
            console.warn(`No title found for ID: ${titleId}`);
            return { name: "", score: 0 };
        }
    } catch (err) {
        console.error("Error fetching title:", err);
        return { name: "", score: 0 };
    }
};

export { fetchTitles, addTitle, updateTitle, deleteTitle, fetchTitleById };