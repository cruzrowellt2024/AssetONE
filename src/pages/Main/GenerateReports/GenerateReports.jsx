import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { fetchDynamicReport } from "../../../firebase/generatereportservices";
import { FiArrowLeft, FiX } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchUsers, fetchUsersByRole } from "../../../firebase/userservices";
import { fetchAssets } from "../../../firebase/assetservices";
import {
  fetchCategories,
  fetchCategoriesWithAssetCount,
} from "../../../firebase/categoryservices";
import {
  fetchDepartments,
  fetchDepartmentsWithAssetCount,
} from "../../../firebase/departmentservices";
import {
  fetchLocations,
  fetchLocationsWithAssetCount,
} from "../../../firebase/locationservices";
import {
  fetchVendors,
  fetchVendorsWithAssetCount,
} from "../../../firebase/vendorservices";
import { fetchPositions } from "../../../firebase/usertitleservices";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";

const reportOptions = [
  "assets",
  "schedules",
  "requests",
  "locations",
  "vendors",
  "departments",
  "activity_log",
  "users",
  "asset_category",
];

const pdfColumnSchemas = {
  assets: [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "condition", label: "Condition" },
    { key: "dateAcquired", label: "Date Acquired" },
    { key: "status", label: "Status" },
    { key: "cost", label: "Cost" },
    { key: "category", label: "Category" },
    { key: "department", label: "Department" },
    { key: "location", label: "Location" },
    { key: "vendor", label: "Vendor" },
  ],
  requests: [
    { key: "description", label: "Description" },
    { key: "priorityScore", label: "Priority Level" },
    { key: "reportedAsset", label: "Asset" },
    { key: "reportedBy", label: "Reported By" },
    { key: "requestType", label: "Type" },
    { key: "status", label: "Status" },
    { key: "dateCreated", label: "Date Reported" },
  ],
  schedules: [
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "priorityScore", label: "Priority Level" },
    { key: "status", label: "Status" },
    { key: "maintenanceType", label: "Maintenance Type" },
    { key: "frequency", label: "Frequency (days)" },
    { key: "scheduledDate", label: "Scheduled Date" },
    { key: "dueDate", label: "Due Date" },
    { key: "dateCompleted", label: "Date Completed" },
  ],
  users: [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "role", label: "Role" },
    { key: "title", label: "Position" },
    { key: "department", label: "Department" },
    { key: "status", label: "Status" },
    { key: "email", label: "Primary Email" },
    { key: "secondaryEmail", label: "Secondary Email" },
    { key: "contactNumber", label: "Contact Number" },
    { key: "dateCreated", label: "Date Created" },
  ],
  asset_category: [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "assetCount", label: "Total Assets" },
  ],
  departments: [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "assetCount", label: "Total Assets" },
  ],
  locations: [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "assetCount", label: "Total Assets" },
  ],
  vendors: [
    { key: "name", label: "Vendor Name" },
    { key: "description", label: "Description" },
    { key: "address", label: "Address" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "emailAddress", label: "Email Address" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "offers", label: "Offers" },
  ],
  activity_log: [
    { key: "action", label: "Action" },
    { key: "remarks", label: "Remarks" },
    { key: "user", label: "User" },
    { key: "timestamp", label: "Timestamp" },
  ],
};

const GenerateReports = () => {
  const [reportType, setReportType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const logoBase64 =
    "data:image/jpg;base64,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"; // or a real base64 string

  useEffect(() => {
    const generate = async () => {
      if (reportData.length > 0) {
        const blob = await generatePDFBlob();
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } else {
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
          setPdfBlobUrl(null);
        }
      }
    };

    generate();
  }, [reportData]);

  const formatTitle = (str) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getPriorityLabel = (score) => {
    if (score <= 24) return "Low";
    if (score <= 49) return "Medium";
    if (score <= 74) return "High";
    return "Critical";
  };

  const formatPDFCell = (
    value,
    key,
    usersMap = {},
    assetsMap = {},
    categoriesMap = {},
    departmentsMap = {},
    locationsMap = {},
    vendorsMap = {},
    titlesMap = {}
  ) => {
    if (!value) return "";

    if (typeof value === "object" && value.seconds !== undefined) {
      return new Date(value.seconds * 1000).toLocaleDateString();
    }

    if (key === "priority_score") {
      return getPriorityLabel(value);
    }

    if (key === "reportedBy") {
      return usersMap[value] || "Unknown Reporter";
    }

    if (key === "user") {
      return usersMap[value] || "Unknown User";
    }

    if (key === "reportedAsset") {
      return assetsMap[value] || "Unknown Asset";
    }

    if (key === "category") {
      return categoriesMap[value] || "Unknown Category";
    }

    if (key === "department") {
      return departmentsMap[value] || "No Department";
    }

    if (key === "location") {
      return locationsMap[value] || "Unknown Location";
    }

    if (key === "vendor") {
      return vendorsMap[value] || "Unknown Vendor";
    }

    if (key === "title" && reportType !== "schedules") {
      return titlesMap[value] || "None";
    }

    return String(value);
  };

  const getPDFTableData = (
    type,
    data,
    usersMap = {},
    assetsMap = {},
    categoriesMap = {},
    departmentsMap = {},
    locationsMap = {},
    vendorsMap = {},
    titlesMap = {}
  ) => {
    const schema = pdfColumnSchemas[type] || [];
    const headers = schema.map((col) => col.label);
    const rows = data.map((row) =>
      schema.map((col) =>
        formatPDFCell(
          row[col.key],
          col.key,
          usersMap,
          assetsMap,
          categoriesMap,
          departmentsMap,
          locationsMap,
          vendorsMap,
          titlesMap
        )
      )
    );
    return { headers, rows };
  };

  const generatePDFBlob = async () => {
    if (!reportData || reportData.length === 0) return null;

    const userList = await fetchUsers();
    const assetList = await fetchAssets();
    const categoryList = await fetchCategories();
    const departmentList = await fetchDepartments();
    const locationList = await fetchLocations();
    const vendorList = await fetchVendors();
    const titleList = await fetchPositions();

    const usersMap = userList.reduce((acc, user) => {
      acc[user.id] =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : "Unknown User";
      return acc;
    }, {});

    const assetsMap = assetList.reduce((acc, asset) => {
      acc[asset.id] = asset.name || "Unknown Asset";
      return acc;
    }, {});

    const categoriesMap = categoryList.reduce((acc, category) => {
      acc[category.id] = category.name || "Unknown Category";
      return acc;
    }, {});

    const departmentsMap = departmentList.reduce((acc, department) => {
      acc[department.id] = department.name || "Unknown Department";
      return acc;
    }, {});

    const locationsMap = locationList.reduce((acc, location) => {
      acc[location.id] = location.name || "Unknown Location";
      return acc;
    }, {});

    const vendorsMap = vendorList.reduce((acc, vendor) => {
      acc[vendor.id] = vendor.name || "Unknown Vendor";
      return acc;
    }, {});

    const titlesMap = titleList.reduce((acc, title) => {
      acc[title.id] = title.name || "Unknown Position";
      return acc;
    }, {});

    const { headers, rows } = getPDFTableData(
      reportType,
      reportData,
      usersMap,
      assetsMap,
      categoriesMap,
      departmentsMap,
      locationsMap,
      vendorsMap,
      titlesMap
    );

    const doc = new jsPDF();

    if (logoBase64) {
      const logoWidth = 30;
      const logoHeight = 10;
      const centerX = (doc.internal.pageSize.getWidth() - logoWidth) / 2;
      doc.addImage(logoBase64, "PNG", centerX, 10, logoWidth, logoHeight);
    }

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.setTextColor(41, 128, 185);
    doc.text(
      `${formatTitle(reportType)} Report`,
      doc.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    return doc.output("blob");
  };

  const convertTimestamps = (dataArray) =>
    dataArray.map((item) => {
      const newItem = { ...item };
      for (const key in newItem) {
        if (
          newItem[key] &&
          typeof newItem[key] === "object" &&
          newItem[key].seconds !== undefined
        ) {
          newItem[key] = new Date(newItem[key].seconds * 1000).toLocaleString();
        }
      }
      return newItem;
    });

  const handleGenerate = async () => {
    if (!reportType) {
      console.error("Missing required inputs");
      return;
    }

    try {
      let data;

      if (reportType === "asset_category") {
        data = await fetchCategoriesWithAssetCount();
      } else if (reportType === "departments") {
        data = await fetchDepartmentsWithAssetCount();
      } else if (reportType === "locations") {
        data = await fetchLocationsWithAssetCount();
      } else if (reportType === "vendors") {
        data = await fetchVendorsWithAssetCount();
      } else if (reportType === "users") {
        data = await fetchUsersByRole(selectedRole);
      } else {
        data = await fetchDynamicReport(reportType, fromDate, toDate);
      }

      if (!data || data.length === 0) {
        setError("No report data found for the selected criteria.");
        setReportData([]); // clear old data if any
        return; // stop further execution
      }

      const filteredData = data.map((item) => {
        const filtered = {};
        for (const key in item) {
          if (
            typeof item[key] !== "object" ||
            item[key]?.seconds !== undefined
          ) {
            filtered[key] = item[key];
          }
        }
        return filtered;
      });

      setReportData(convertTimestamps(filteredData));
      setShowDateModal(false);
      setShowRoleModal(false);
      setSelectedRole("");
      setFromDate("");
      setToDate("");
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData([]);
      setShowDateModal(false);
      setShowRoleModal(false);
    }
  };

  const handleExport = (type) => {
    if (!reportData.length) return;
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const fileName = `${reportType.replace(
      /\s/g,
      "_"
    )}_${fromDate}_to_${toDate}.${type === "excel" ? "xlsx" : "csv"}`;

    const excelBuffer = XLSX.write(workbook, {
      bookType: type === "excel" ? "xlsx" : "csv",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, fileName);
  };

  const handleExportPDF = async () => {
    if (!reportData.length) return;

    const blob = await generatePDFBlob();
    if (!blob) return;

    saveAs(blob, `${reportType}_${fromDate}_to_${toDate}.pdf`);
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  return (
    <div className="flex flex-col m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-h-[calc(100%-6rem)] rounded-lg shadow-2xl">
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <div>
            <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-0">
              Select Report
            </h1>
            <label>Select the reports you want to generate.</label>
          </div>
        </div>
      </div>

      {reportData.length > 0 && Object.keys(reportData[0]).length > 0 ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setReportData([])}
          role="dialog"
          aria-labelledby="activity-modal-header"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <FiArrowLeft
                    className="cursor-pointer"
                    onClick={() => setReportData([])}
                    aria-label="Back to report selection"
                  />
                  <h3 className="text-lg font-semibold">Report</h3>
                </div>
              </div>

              <div className="w-full border-collapse table-fixed">
                {pdfBlobUrl ? (
                  <div style={{ height: "400px" }}>
                    <iframe
                      src={pdfBlobUrl}
                      title="PDF Preview"
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    />
                  </div>
                ) : (
                  <div className="m-8 flex items-center justify-center">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 rounded-full border-2 border-white border-t-black animate-spin"></div>
                    </div>
                  </div>
                )}
              </div>

              {reportData.length > 0 && (
                <div className="flex justify-end items-center gap-4 p-4 border-t border-gray-200">
                  <button
                    className="text-gray-200 hover:text-gray-900 px-4 py-2 rounded border border-gray-300 bg-green-900 hover:bg-green-100 transition"
                    onClick={() => handleExport("excel")}
                  >
                    Export Excel
                  </button>
                  <button
                    className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition"
                    onClick={() => handleExportPDF()}
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 text-sm gap-4 md:text-base m-auto p-4">
          {reportOptions.map((option) => (
            <label
              key={option}
              className="cursor-pointer flex items-center space-x-2"
            >
              <input
                type="radio"
                name="reportType"
                value={option}
                checked={reportType === option}
                onChange={(e) => setReportType(e.target.value)}
                className="form-radio"
              />
              <span>{formatTitle(option)} Report</span>
            </label>
          ))}

          <div className="grid col-span-2 grid-cols-1 place-items-center mt-5">
            <button
              className={`px-6 py-2 rounded 
          text-white 
          ${
            !reportType
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } 
          transition-colors duration-200`}
              onClick={() => {
                if (
                  [
                    "asset_category",
                    "departments",
                    "locations",
                    "vendors",
                  ].includes(reportType)
                ) {
                  handleGenerate();
                } else if (reportType === "users") {
                  setShowRoleModal(true);
                } else {
                  setShowDateModal(true);
                }
              }}
              disabled={!reportType}
            >
              Generate Report
            </button>
          </div>
        </div>
      )}

      {showDateModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowDateModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-700 text-white flex items-center justify-between py-4 px-6 rounded-t-lg">
              <h3 className="text-lg font-semibold">Select Date Range</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowDateModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 items-center">
                <label htmlFor="from-date" className="text-sm font-medium">
                  From:
                </label>
                <input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <label htmlFor="to-date" className="text-sm font-medium">
                  To:
                </label>
                <input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-4 p-6 border-t border-gray-200">
              <button
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                onClick={() => setShowDateModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                onClick={handleGenerate}
                disabled={!fromDate || !toDate}
              >
                Generate
              </button>
            </div>
          </div>

          {isLoading && <SpinnerOverlay logo="A" />}

          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />
        </div>
      )}

      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowRoleModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-700 text-white flex items-center justify-between py-4 px-6 rounded-t-lg">
              <h3 className="text-lg font-semibold">Select Role</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowRoleModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 items-center gap-4">
                <label className="text-sm font-medium">Role:</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">-- Select Role --</option>
                  <option value="system_administrator">
                    System Administrator
                  </option>
                  <option value="operational_administrator">
                    Operational Administrator
                  </option>
                  <option value="department_manager">Department Manager</option>
                  <option value="finance">Finance</option>
                  <option value="maintenance_head">Maintenance Head</option>
                  <option value="maintenance_technician">
                    Maintenance Technician
                  </option>
                  <option value="reporter">Reporter</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-4 p-6 border-t border-gray-200">
              <button
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                onClick={handleGenerate}
                disabled={!selectedRole}
              >
                Generate
              </button>
            </div>
          </div>

          {isLoading && <SpinnerOverlay logo="A" />}

          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />
        </div>
      )}
    </div>
  );
};

export default GenerateReports;
