import { createUserWithEmailAndPassword } from "firebase/auth";
import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { db, secondaryAuth } from "./firebase";
import { addActivityLog } from './activtylogservices';

const fetchUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userLists = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return userLists;
    } catch (error) {
        console.error("Error fetching users:", error);
    }
};

const fetchUsersByRole = async (role) => {
    try {
        let q;
        if (role === "All") {
            q = query(collection(db, "users"), orderBy("role"));
        } else {
            q = query(collection(db, "users"), where("role", "==", role), orderBy("role"));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching users by role:", error);
    }
};

const generateUserId = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userIds = querySnapshot.docs.map((doc) => doc.id);

        if (userIds.length > 0) {
            const highestID = Math.max(...userIds.map((id) => parseInt(id.replace("U-", ""))));
            return `U-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "U-00001";
        }
    } catch (error) {
        console.error("Error generating user ID:", error);
        return "U-00001";
    }
};

const addUser = async (firstName, lastName, email, password, role, department, priorityScore, logby) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;

        const userId = await generateUserId();

        await setDoc(doc(db, "users", userId), {
            firstName,
            lastName,
            role,
            status: "Available",
            email: user.email,
            authUID: user.uid,
            secondaryEmail: "",
            contactNumber: "",
            department,
            priorityScore,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Create User", `User ID: ${userId}`);

        await secondaryAuth.signOut();

    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
};

const updateUser = async (selectedUser, logby) => {
    if (!selectedUser) return;

    try {
        if (selectedUser.department === undefined) {
            selectedUser.department = 'None';
        }

        await setDoc(doc(db, "users", selectedUser.id), {
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
            contactNumber: selectedUser.contactNumber,
            email: selectedUser.email,
            secondaryEmail: selectedUser.secondaryEmail,
            department: selectedUser.department,
            status: selectedUser.status,
            priorityScore: selectedUser.priorityScore || "None",
            role: selectedUser.role,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update User", `User ID: ${selectedUser.id}`);

    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

const updateUserStatus = async ( status, logby) => {
    if (!logby) return;

    try {

        await setDoc(doc(db, "users", logby), {
            status: status,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update User", `User ID: ${logby}`);

    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

const deleteUser = async (user, logby) => {
    if (!user?.id) throw new Error("User ID is required");

    try {
        await deleteDoc(doc(db, "users", user.id));
        await addActivityLog(logby, "Delete User", `User ID: ${user.id}`);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

const getUserProfileRef = async (uid) => {
    if (!uid) throw new Error("UID is required");
  
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("authUID", "==", uid));
    const snapshot = await getDocs(q);
  
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return doc(db, "users", docSnap.id);
    } else {
      throw new Error("User profile not found");
    }
  };

export { fetchUsers, addUser, updateUser, updateUserStatus, deleteUser, getUserProfileRef, fetchUsersByRole };