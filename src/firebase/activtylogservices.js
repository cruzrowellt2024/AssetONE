import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

const fetchActivityLogs = async () => {
    try {
        const q = query(
            collection(db, "activity_log"),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return [];
    }
};

const generateActivityLogID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "activity_log"));
        const logIds = querySnapshot.docs.map((doc) => doc.id);

        if (logIds.length > 0) {
            const highestID = Math.max(...logIds.map((id) => parseInt(id.replace("AL-", ""))));
            return `AL-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "AL-00001";
        }
    } catch (error) {
        console.error("Error generating activity log ID:", error);
        return "AL-00001";
    }
};

const addActivityLog = async (user, action, remarks = "") => {
    if (!user) {
        console.error("User is required to add activity log.");
        return;
    }
    
    try {
        const newLogID = await generateActivityLogID();

        await setDoc(doc(db, "activity_log", newLogID), {
            user,
            action,
            remarks,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding activity log:", error);
        throw error;
    }
};

const updateActivityLog = async (log) => {
    if (!log || !log.id) return;

    try {
        await setDoc(doc(db, "activity_log", log.id), {
            user: log.user,
            action: log.action,
            remarks: log.remarks,
            timestamp: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error updating activity log:", error);
        throw error;
    }
};

const deleteActivityLog = async (logId) => {
    if (!logId) throw new Error("Log ID is required");

    try {
        await deleteDoc(doc(db, "activity_log", logId));
    } catch (error) {
        console.error("Error deleting activity log:", error);
        throw error;
    }
};

export { fetchActivityLogs, addActivityLog, updateActivityLog, deleteActivityLog };