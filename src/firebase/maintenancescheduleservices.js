import { getDocs, collection, setDoc, doc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from "./activtylogservices";

const fetchSchedules = async () => {
    try {
        const q = query(collection(db, "schedules"), orderBy("priorityScore", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return [];
    }
};

const generateScheduleID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "schedules"));
        const scheduleIds = querySnapshot.docs.map((doc) => doc.id);

        if (scheduleIds.length > 0) {
            const highestID = Math.max(...scheduleIds.map((id) => parseInt(id.replace("S-", ""))));
            return `S-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "S-00001";
        }
    } catch (error) {
        console.error("Error generating schedule ID:", error);
        return "S-00001";
    }
};

const addSchedule = async (schedule, logby) => {
    try {
        const scheduleID = await generateScheduleID();

        await setDoc(doc(db, "schedules", scheduleID), {
            ...schedule,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Schedule", `Schedule ID: ${scheduleID}`);
    } catch (error) {
        console.error("Error adding maintenance schedule:", error);
        throw error;
    }
};

const updateSchedule = async (selectedSchedule, isCompleted, logby) => {
    if (!selectedSchedule) return;

    try {
        const updatedData = {
            ...selectedSchedule,
            dateUpdated: serverTimestamp(),
        };

        if (isCompleted) {
            updatedData.dateCompleted = serverTimestamp();
        }

        await setDoc(doc(db, "schedules", selectedSchedule.id), updatedData, { merge: true });

        await addActivityLog(logby, "Update Schedule", `Schedule ID: ${selectedSchedule.id}`);
    } catch (error) {
        console.error("Error updating maintenance schedule:", error);
        throw error;
    }
};

const deleteSchedule = async (scheduleId, logby) => {
    if (!scheduleId) throw new Error("Schedule ID is required");

    try {
        await deleteDoc(doc(db, "schedules", scheduleId));
        await addActivityLog(logby, "Delete Schedule", `Schedule ID: ${scheduleId}`);
    } catch (error) {
        console.error("Error deleting maintenance schedule:", error);
        throw error;
    }
};

export { fetchSchedules, addSchedule, updateSchedule, deleteSchedule };