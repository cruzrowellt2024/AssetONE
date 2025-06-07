import { getDocs, collection, query, where, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

const fetchDynamicReport = async (reportType, fromDate, toDate) => {
    if (!fromDate || !toDate) throw new Error("Missing date input");

    const from = Timestamp.fromDate(new Date(fromDate));
    const toDateObj = new Date(toDate);
    toDateObj.setHours(23, 59, 59, 999);
    const to = Timestamp.fromDate(toDateObj);

    const timestampFieldMap = {
        assets: "dateCreated",
        schedules: "scheduledDate",
        requests: "dateCreated",
        locations: "dateCreated",
        vendors: "dateCreated",
        departments: "dateCreated",
        asset_category: "dateCreated",
        activity_log: "timestamp",
        users: "dateCreated",
    };

    const timestampField = timestampFieldMap[reportType];
    if (!timestampField) throw new Error("Unsupported report type or missing timestamp field");

    const q = query(
        collection(db, reportType),
        where(timestampField, ">=", from),
        where(timestampField, "<=", to)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export { fetchDynamicReport };