import {
  addDoc,
  getDocs,
  collection,
  getDoc,
  setDoc,
  writeBatch,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { addActivityLog } from "./activtylogservices";

const fetchUnits = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "units"));
    const unitList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return unitList;
  } catch (error) {
    console.error("Error fetching units:", error);
  }
};

const generateUnitID = async () => {
  const counterRef = doc(db, 'metadata', 'unitCounter');

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {
      throw new Error('unitCounter document does not exist.');
    }

    const currentCount = counterDoc.data().count || 0;
    const newCount = currentCount + 1;

    transaction.update(counterRef, {
      count: increment(1),
    });

    const unitID = `AU-${String(newCount).padStart(5, '0')}`;
    return unitID;
  });
};


const generateUnitRequestID = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "unit_requests"));
    const unitIds = querySnapshot.docs.map((doc) => doc.id);

    if (unitIds.length > 0) {
      const highestID = Math.max(
        ...unitIds.map((id) => parseInt(id.replace("UR-", "")))
      );
      return `UR-${(highestID + 1).toString().padStart(5, "0")}`;
    } else {
      return "UR-00001";
    }
  } catch (error) {
    console.error("Error generating unit ID:", error);
    return "UR-00001";
  }
};

const getNextUnitNumber = async (asset) => {
  const counterRef = doc(db, "assetCounters", asset);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      const current = snap.exists() ? snap.data().count || 0 : 0;
      const next = current + 1;

      transaction.set(counterRef, { count: next }, { merge: true });

      return next;
    });

    return result;
  } catch (error) {
    console.error("Transaction failed:", error);
    return 1;
  }
};

const addUnit = async (unit, logby) => {
  try {
    const {
      asset,
      dateAcquired,
      cost,
      status,
      condition,
      department,
      location,
      vendor,
      specs,
      isLegacy
    } = unit;

    const unitID = await generateUnitID();
    const unitNumber = await getNextUnitNumber(asset);

    await setDoc(doc(db, "units", unitID), {
      asset,
      unitNumber,
      dateAcquired,
      cost,
      status,
      condition,
      department,
      location,
      vendor,
      addedBy: logby,
      isLegacy: isLegacy,
      requestedBy: isLegacy ? "" : logby,
      lastUpdatedBy: logby,
      dateCreated: serverTimestamp(),
      dateUpdated: serverTimestamp(),
    });

    const specsRef = collection(db, "units", unitID, "specifications");
    for (const spec of specs) {
      await addDoc(specsRef, spec);
    }

    await addActivityLog(logby, "Add Unit", `Unit ID: ${unitID}`);
  } catch (error) {
    console.error("Error adding unit:", error);
    throw error;
  }
};

const addRequestUnit = async (request, logby) => {
  try {
    const {
      asset,
      quantity,
      estimatedCostPerUnit,
      totalCost,
      reason,
      specs,
    } = request;

    const unitRequestID = await generateUnitRequestID();

    await setDoc(doc(db, "unit_requests", unitRequestID), {
      asset,
      quantity,
      estimatedCostPerUnit,
      totalCost,
      reason,
      status: "Pending",
      requestedBy: logby,
      lastUpdatedBy: logby,
      dateCreated: serverTimestamp(),
      dateUpdated: serverTimestamp(),
    });

    const specsRef = collection(db, "unit_requests", unitRequestID, "specifications");
    for (const spec of specs) {
      await addDoc(specsRef, spec);
    }

    await addActivityLog(logby, "Request Unit", `Unit Request ID: ${unitRequestID}`);
  } catch (error) {
    console.error("Error adding unit:", error);
    throw error;
  }
};

const updateUnit = async (selectedUnit, logby) => {
  if (!selectedUnit) return;

  try {
    await setDoc(
      doc(db, "units", selectedUnit.id),
      {
        asset: selectedUnit.asset ?? "",
        dateAcquired: selectedUnit.dateAcquired ?? "",
        cost: selectedUnit.cost ?? 0,
        status: selectedUnit.status ?? "Active",
        condition: selectedUnit.condition ?? "Good",
        department: selectedUnit.department ?? "",
        location: selectedUnit.location ?? "",
        vendor: selectedUnit.vendor ?? "",
        addedBy: selectedUnit.addedBy ?? "",
        requestedBy: selectedUnit.requestedBy ?? "",
        lastUpdatedBy: logby ?? "",
        dateUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    await addActivityLog(logby, "Update Unit", `Unit ID: ${selectedUnit.id}`);
  } catch (error) {
    console.error("Error updating unit:", error);
    throw error;
  }
};

const updateRequestUnit = async (selectedRequest, remarks, status, logby) => {
  if (!selectedRequest) return;
  try {
    await setDoc(
      doc(db, "unit_requests", selectedRequest.id),
      {
        asset: selectedRequest.asset ?? "",
        quantity: selectedRequest.quantity ?? 0,
        estimatedCostPerUnit: selectedRequest.estimatedCostPerUnit ?? 0,
        totalCost: selectedRequest.totalCost ?? 0,
        reason: selectedRequest.reason ?? "",
        status: status ?? "Pending",
        remarks: remarks ?? "",
        requestedBy: selectedRequest.requestedBy ?? "",
        lastUpdatedBy: logby ?? "",
        dateUpdated: serverTimestamp(),
      },
      { merge: true }
    );
    await addActivityLog(logby, "Update Unit Request", `Unit Request ID: ${selectedRequest.id}`);
  } catch (error) {
    console.error("Error updating unit request:", error);
    throw error;
  }
};

const deleteUnit = async (unitId, logby) => {
  if (!unitId) throw new Error("Unit ID is required");

  try {
    await deleteDoc(doc(db, "units", unitId));
    await addActivityLog(logby, "Delete Unit", `Unit ID: ${unitId}`);
  } catch (error) {
    console.error("Error deleting unit:", error);
    throw error;
  }
};

const getUnitNameById = async (unitId) => {
  if (!unitId) throw new Error("Unit ID is required");

  try {
    const unitDoc = await getDoc(doc(db, "units", unitId));
    if (unitDoc.exists()) {
      return unitDoc.data().name;
    } else {
      throw new Error("Unit not found");
    }
  } catch (error) {
    console.error("Error fetching unit name:", error);
    throw error;
  }
};

const fetchUnitById = async (unitId) => {
  const docRef = doc(db, "units", unitId);
  const docSnap = await getDoc(docRef);
  console.log(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

const fetchSpecs = async (unitID) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "units", unitID, "specifications")
    );
    const specs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    specs.sort((a, b) => a.index - b.index);
    return specs;
  } catch (error) {
    console.error("Error fetching specifications:", error);
  }
};

const fetchRequestSpecs = async (unitID) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "unit_requests", unitID, "specifications")
    );
    const specs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    specs.sort((a, b) => a.index - b.index);
    return specs;
  } catch (error) {
    console.error("Error fetching specifications:", error);
  }
};

const updateUnitSpecs = async (unitId, newSpecs, userId) => {
  try {
    const specsRef = collection(db, "units", unitId, "specifications");
    const existingSpecsSnapshot = await getDocs(specsRef);
    const existingSpecs = existingSpecsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Create maps for easier comparison
    const existingSpecsMap = new Map(
      existingSpecs.map((spec) => [spec.key, spec])
    );
    const newSpecsMap = new Map(newSpecs.map((spec) => [spec.key, spec]));

    // Batch operations
    const batch = writeBatch(db);

    // Update modified specs and identify unchanged ones
    for (const [key, newSpec] of newSpecsMap) {
      if (existingSpecsMap.has(key)) {
        const existingSpec = existingSpecsMap.get(key);
        // Only update if value changed
        if (existingSpec.value !== newSpec.value) {
          const specDocRef = doc(specsRef, existingSpec.id);
          batch.update(specDocRef, { value: newSpec.value });
        }
        existingSpecsMap.delete(key); // Remove from map to track remaining
      } else {
        // Add new spec
        const newDocRef = doc(specsRef);
        batch.set(newDocRef, { key, value: newSpec.value });
      }
    }

    // Delete specs that no longer exist
    for (const [key, spec] of existingSpecsMap) {
      const specDocRef = doc(specsRef, spec.id);
      batch.delete(specDocRef);
    }

    // Update parent unit timestamp
    const unitRef = doc(db, "units", unitId);
    batch.update(unitRef, {
      dateUpdated: serverTimestamp(),
      lastUpdatedBy: userId,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error updating unit specs:", error);
    throw error;
  }
};

const fetchUnitDataById = async (unitId) => {
  const docRef = doc(db, "units", unitId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Unit not found in Firestore");
  }
};

const fetchUnitsByAssetId = async (assetId) => {
  if(!assetId) return [];
  const q = query(collection(db, "units"), where("asset", "==", assetId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export {
  fetchUnits,
  fetchSpecs,
  fetchRequestSpecs,
  fetchUnitsByAssetId,
  addUnit,
  addRequestUnit,
  updateUnit,
  updateRequestUnit,
  deleteUnit,
  getUnitNameById,
  fetchUnitById,
  updateUnitSpecs,
  fetchUnitDataById,
};
