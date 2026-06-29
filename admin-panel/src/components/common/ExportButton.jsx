// src/components/common/ExportButton.jsx
import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Table, ChevronDown, Loader2 } from "lucide-react";
import { convertToCSV, convertToExcelHTML, downloadFile } from "../../utils/exportUtils";

const ExportButton = ({
    fetchData,
    filename = "export",
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExport = async (format) => {
        if (isExporting) return;

        setIsOpen(false);
        setIsExporting(true);

        try {
            // Simulate/Show progress - as requested by user
            const data = await fetchData();

            if (!data || !data.length) {
                alert("No data available to export");
                return;
            }

            const timestamp = new Date().toISOString().split('T')[0];
            const fullFilename = `${filename}_${timestamp}`;

            if (format === "csv") {
                const csv = convertToCSV(data);
                downloadFile(csv, `${fullFilename}.csv`, "text/csv;charset=utf-8;");
            } else if (format === "excel") {
                const excel = convertToExcelHTML(data);
                downloadFile(excel, `${fullFilename}.xls`, "application/vnd.ms-excel");
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-600 rounded-lg text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Export Data"
            >
                {isExporting ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                )}
                <span>{isExporting ? "Exporting..." : "Export"}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Progress Overlay (Visible during export) */}
            {isExporting && (
                <div className="fixed inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] z-[9999] flex items-center justify-center pointer-events-none">
                    {/* Subtle invisible overlay to prevent interactions while showing local progress */}
                </div>
            )}

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        <button
                            onClick={() => handleExport("csv")}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded-lg transition-colors group"
                        >
                            <FileText size={16} className="text-gray-400 group-hover:text-purple-600" />
                            <div className="text-left">
                                <span className="block font-medium">Export CSV</span>
                                <span className="text-[10px] text-gray-400">Comma separated</span>
                            </div>
                        </button>
                        <button
                            onClick={() => handleExport("excel")}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded-lg transition-colors group mt-0.5"
                        >
                            <Table size={16} className="text-gray-400 group-hover:text-emerald-600" />
                            <div className="text-left">
                                <span className="block font-medium">Export Excel</span>
                                <span className="text-[10px] text-gray-400">Excel compatible</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
