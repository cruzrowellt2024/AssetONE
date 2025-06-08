import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from './activtylogservices';

const fetchDepartments = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "departments"));
        const departmentList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return departmentList;
    } catch (error) {
        console.error("Error fetching departments:", error);
    }
};

const generateDepartmentID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "departments"));
        const departmentIds = querySnapshot.docs.map((doc) => doc.id);

        if (departmentIds.length > 0) {
            const highestID = Math.max(...departmentIds.map((id) => parseInt(id.replace("D-", ""))));
            return `D-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "D-00001";
        }
    } catch (error) {
        console.error("Error generating department ID:", error);
        return "D-00001";
    }
};

const addDepartment = async (name, description, departmentType, logby) => {
    try {
        const newDepartmentID = await generateDepartmentID();

        await setDoc(doc(db, "departments", newDepartmentID), {
            name,
            description,
            departmentType,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Department", `Department ID: ${newDepartmentID}`);
    } catch (error) {
        console.error("Error adding department:", error);
        throw error;
    }
};

const updateDepartment = async (selectedDepartment, logby) => {
    if (!selectedDepartment) return;

    try {
        await setDoc(doc(db, "departments", selectedDepartment.id), {
            name: selectedDepartment.name,
            description: selectedDepartment.description,
            departmentType: selectedDepartment.deparmentType,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Department", `Department ID: ${selectedDepartment.id}`);
    } catch (error) {
        console.error("Error updating department:", error);
        throw error;
    }
};

const deleteDepartment = async (departmentId, logby) => {
    if (!departmentId) throw new Error("Department ID is required");

    try {
        await deleteDoc(doc(db, "departments", departmentId));
        await addActivityLog(logby, "Delete Department", `Department ID: ${departmentId}`);
    } catch (error) {
        console.error("Error deleting department:", error);
        throw error;
    }
};

const fetchDepartmentsWithAssetCount = async () => {
    const departmentSnap = await getDocs(collection(db, 'departments'));
    const assetSnap = await getDocs(collection(db, 'assets'));

    const assetList = assetSnap.docs.map(doc => doc.data());
    const departmentList = departmentSnap.docs.map(doc => {
        const departmentId = doc.id;
        const departmentData = doc.data();

        const count = assetList.filter(asset => asset.department === departmentId).length;

        return {
            id: departmentId,
            ...departmentData,
            assetCount: count,
        };
    });

    return departmentList;
};

export { fetchDepartments, addDepartment, updateDepartment, deleteDepartment, fetchDepartmentsWithAssetCount };