import { getDocs, collection, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from './activtylogservices';

const fetchCategories = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const categoryList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return categoryList;
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
};

const generateCategoryID = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const categoryIds = querySnapshot.docs.map((doc) => doc.id);

        if (categoryIds.length > 0) {
            const highestID = Math.max(...categoryIds.map((id) => parseInt(id.replace("C-", ""))));
            return `C-${(highestID + 1).toString().padStart(5, "0")}`;
        } else {
            return "C-00001";
        }
    } catch (error) {
        console.error("Error generating category ID:", error);
        return "C-00001";
    }
};

const addCategory = async (name, description, logby) => {
    try {
        const newCategoryID = await generateCategoryID();

        await setDoc(doc(db, "categories", newCategoryID), {
            name,
            description,
            dateCreated: serverTimestamp(),
            dateUpdated: serverTimestamp(),
        });

        await addActivityLog(logby, "Add Category", `Category ID: ${newCategoryID}`);
    } catch (error) {
        console.error("Error adding category:", error);
        throw error;
    }
};

const updateCategory = async (selectedCategory, logby) => {
    if (!selectedCategory) return;

    try {
        await setDoc(doc(db, "categories", selectedCategory.id), {
            name: selectedCategory.name,
            description: selectedCategory.description,
            dateUpdated: serverTimestamp(),
        }, { merge: true });

        await addActivityLog(logby, "Update Category", `Category ID: ${selectedCategory.id}`);
    } catch (error) {
        console.error("Error updating category:", error);
        throw error;
    }
};

const deleteCategory = async (categoryId, logby) => {
    if (!categoryId) throw new Error("Category ID is required");

    try {
        await deleteDoc(doc(db, "categories", categoryId));
        await addActivityLog(logby, "Delete Category", `Category ID: ${categoryId}`);
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

const fetchCategoriesWithAssetCount = async () => {
    const categorySnap = await getDocs(collection(db, 'categories'));
    const assetSnap = await getDocs(collection(db, 'assets'));

    const assetList = assetSnap.docs.map(doc => doc.data());
    const categoryList = categorySnap.docs.map(doc => {
        const categoryId = doc.id;
        const categoryData = doc.data();

        const count = assetList.filter(asset => asset.category === categoryId).length;

        return {
            id: categoryId,
            ...categoryData,
            assetCount: count,
        };
    });

    return categoryList;
};


export { fetchCategories, addCategory, updateCategory, deleteCategory, fetchCategoriesWithAssetCount };