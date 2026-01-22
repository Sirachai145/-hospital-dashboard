import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Calendar, FileText, Activity, Users, BedDouble, ChevronRight, Filter, AlertCircle } from 'lucide-react';

// Load XLSX library dynamically
const useXLSX = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.XLSX) {
      setIsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
  }, []);
  return isLoaded;
};

// --- Helper Components ---

const Card = ({ title, value, subtext, isActive, onClick, colorClass, icon: Icon }) => (
  <div 
    onClick={onClick}
    className={`cursor-pointer p-6 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
      isActive 
        ? `border-${colorClass}-500 ring-2 ring-${colorClass}-200 bg-${colorClass}-50` 
        : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-${colorClass}-100 text-${colorClass}-600`}>
        <Icon size={24} />
      </div>
      {isActive && <div className={`h-3 w-3 rounded-full bg-${colorClass}-500 animate-pulse`} />}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
    <p className="text-xs text-slate-400 mt-2">{subtext}</p>
  </div>
);

// --- Main Application ---

export default function PatientDashboard() {
  const isXLSXLoaded = useXLSX();
  
  // State for uploaded data
  const [dataSheets, setDataSheets] = useState({
    sheet1: [], // Regular OPD
    sheet2: [], // Special Clinic
    sheet3: [], // Premium Clinic
    sheet4: []  // IPD
  });
  const [isRealData, setIsRealData] = useState(false); // Track if using real data

  const [activeTab, setActiveTab] = useState(0); 
  const [selectedMonth, setSelectedMonth] = useState('2569-01');
  
  const [dateRange, setDateRange] = useState({
    start: 0,
    end: 6 
  });

  // --- Initial Mock Data Generator ---
  useEffect(() => {
    const generateMockData = (rows, totalRowIndex, prefix) => {
      const days = 31;
      const data = [];
      // Header Rows (Simulate spacing in real file)
      data.push([], [], [], ["Code", "Clinic", ...Array.from({length: days}, (_, i) => `2569-01-${String(i+1).padStart(2, '0')}`)]);
      
      // Data Rows
      for (let i = 1; i < 60; i++) {
        const rowData = [`C${i}`, `${prefix} Clinic ${i}`];
        for (let d = 0; d < days; d++) rowData.push(Math.floor(Math.random() * 20));
        data.push(rowData);
      }
      
      // Ensure Total Row exists at specific index requested
      // Excel Row 84 = Index 83.
      while(data.length <= totalRowIndex) data.push([]);
      
      const totalRow = ["Total", "รวมผู้ป่วย"];
      for (let d = 0; d < days; d++) totalRow.push(Math.floor(Math.random() * 500) + 100);
      data[totalRowIndex - 1] = totalRow; 
      
      return data;
    };

    const generateIPDMockData = () => {
      const days = 31;
      const data = [];
      const header = ["Ward", "Type", "Bed Count", "Info"];
      for(let i=1; i<=days; i++) {
        const date = `2569-01-${String(i).padStart(2, '0')}`;
        header.push(date, "", ""); // 3 columns per date
      }
      data.push(header);
      
      const subHeader = ["", "", "", ""];
      for(let i=1; i<=days; i++) subHeader.push("คงเหลือ", "รับใหม่", "รับย้าย");
      data.push(subHeader);

      for(let i=0; i<15; i++) {
        const row = [`Ward ${i}`, "Normal", 20, ""];
        for(let d=0; d<days*3; d++) row.push(Math.floor(Math.random() * 5));
        data.push(row);
      }
      return data;
    };

    setDataSheets({
      sheet1: generateMockData(90, 84, "OPD In-Time"),
      sheet2: generateMockData(40, 30, "Special Clinic"),
      sheet3: generateMockData(25, 19, "Premium"),
      sheet4: generateIPDMockData()
    });
  }, []);


  // --- Data Processing Logic ---

  const processedData = useMemo(() => {
    const processNormalSheet = (sheetData, totalRowExcelIndex) => {
      if (!sheetData || sheetData.length === 0) return { chartData: [], tableData: [], dates: [], totalToday: 0 };
      
      // Find Header Row (Look for "2569" or dates)
      let headerRowIndex = sheetData.findIndex(row => row && row.some(cell => String(cell).includes("2569") || String(cell).includes("-")));
      if (headerRowIndex === -1) headerRowIndex = 0; // Fallback
      
      const headerRow = sheetData[headerRowIndex];
      const dates = [];
      const dateIndices = [];

      // Extract Dates
      headerRow.forEach((cell, idx) => {
         if (String(cell).includes("2569") || String(cell).includes("-")) {
             dates.push(cell);
             dateIndices.push(idx);
         }
      });

      // Get Total Row
      // Try specific row first (Index = ExcelRow - 1)
      let totalRowIndex = totalRowExcelIndex - 1; 
      let totalRow = sheetData[totalRowIndex];

      // Smart Fallback: look for row starting with "รวม" or "Total" nearby if exact row is empty
      if (!totalRow || !totalRow[dateIndices[0]]) {
         const foundIndex = sheetData.findIndex(r => r && r.some(c => String(c).includes("รวม") || String(c).includes("Total")));
         if (foundIndex !== -1) {
             totalRowIndex = foundIndex;
             totalRow = sheetData[foundIndex];
         }
      }

      const chartData = dates.map((date, idx) => {
          const val = totalRow ? parseInt(totalRow[dateIndices[idx]] || 0) : 0;
          return { date, value: isNaN(val) ? 0 : val };
      });

      // Table Data (Filter out empty rows and header/total rows)
      const tableData = sheetData.slice(headerRowIndex + 1).filter((row, idx) => {
          const actualIdx = idx + headerRowIndex + 1;
          const hasName = row[1] && String(row[1]).trim() !== "";
          const isNotTotal = actualIdx !== totalRowIndex;
          return hasName && isNotTotal;
      });
      
      // Normalize Table Data for display
      const normalizedTableData = tableData.map(row => {
          const values = dateIndices.map(colIdx => row[colIdx]);
          return [row[0], row[1], ...values];
      });

      return {
        chartData,
        tableData: normalizedTableData,
        dates,
        totalToday: chartData[chartData.length - 1]?.value || 0
      };
    };

    const processIPDSheet = (sheetData) => {
        if (!sheetData || sheetData.length < 3) return { chartData: [], tableData: [], dates: [], totalToday: 0 };

        // Header search
        let headerRowIndex = sheetData.findIndex(row => row && row.some(cell => String(cell).includes("2569")));
        if (headerRowIndex === -1) headerRowIndex = 0;
        
        const headerRow = sheetData[headerRowIndex];
        const dates = [];
        const dateIndices = [];

        // In IPD sheet, dates are merged cells, usually appearing every 3 columns
        for(let i=0; i<headerRow.length; i++) {
            if(headerRow[i] && (String(headerRow[i]).includes("2569") || String(headerRow[i]).includes("-"))) {
                dates.push(headerRow[i]);
                dateIndices.push(i);
            }
        }

        // Logic: Sum of (Remain + New + Moved In) for each day
        const chartData = dates.map((date, idx) => {
            const startCol = dateIndices[idx];
            let dailyTotal = 0;
            
            // Iterate data rows
            for(let r=headerRowIndex + 2; r<sheetData.length; r++) {
                const row = sheetData[r];
                if(!row || !row[1]) continue; // Skip empty rows
                
                // Check if it's a valid ward row (not a subheader or total)
                if (String(row[1]).includes("รวม")) continue;

                const remain = parseInt(row[startCol] || 0);
                const newVal = parseInt(row[startCol+1] || 0);
                const movedIn = parseInt(row[startCol+2] || 0);
                
                const sum = (isNaN(remain)?0:remain) + (isNaN(newVal)?0:newVal) + (isNaN(movedIn)?0:movedIn);
                dailyTotal += sum;
            }
            return { date, value: dailyTotal };
        });

        const tableData = [];
        for(let r=headerRowIndex + 2; r<sheetData.length; r++) {
            const row = sheetData[r];
            if(!row || !row[1]) continue;
            if (String(row[1]).includes("รวม")) continue;

            const newRow = [row[0], row[1]];
            dates.forEach((_, idx) => {
                const startCol = dateIndices[idx];
                const remain = parseInt(row[startCol] || 0);
                const newVal = parseInt(row[startCol+1] || 0);
                const movedIn = parseInt(row[startCol+2] || 0);
                const sum = (isNaN(remain)?0:remain) + (isNaN(newVal)?0:newVal) + (isNaN(movedIn)?0:movedIn);
                newRow.push(sum);
            });
            tableData.push(newRow);
        }

        return {
            chartData,
            tableData,
            dates,
            totalToday: chartData[chartData.length - 1]?.value || 0
        };
    };

    return {
        0: processNormalSheet(dataSheets.sheet1, 84),
        1: processNormalSheet(dataSheets.sheet2, 30),
        2: processNormalSheet(dataSheets.sheet3, 19),
        3: processIPDSheet(dataSheets.sheet4)
    };
  }, [dataSheets]);

  // --- Handlers ---

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = window.XLSX.read(data, { type: 'array' });
      
      // Assumption: Sheets are in order 1, 2, 3, 4 as requested
      // If sheet names are fixed, we could map by name, but index is safer if names change
      const newSheets = {
          sheet1: window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header:1, defval:''}),
          sheet2: window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], {header:1, defval:''}),
          sheet3: window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[2]], {header:1, defval:''}),
          sheet4: window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[3]], {header:1, defval:''}),
      };
      
      setDataSheets(newSheets);
      setIsRealData(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDateRangeChange = (direction) => {
    const currentDataSet = currentData;
    if (direction === 'next') {
        if (dateRange.end < currentDataSet.dates.length - 1) {
            setDateRange({ start: dateRange.start + 1, end: dateRange.end + 1 });
        }
    } else {
        if (dateRange.start > 0) {
            setDateRange({ start: dateRange.start - 1, end: dateRange.end - 1 });
        }
    }
  };

  const currentData = processedData[activeTab];

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hospital Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">รายงานยอดผู้ป่วยรายวัน (Daily Patient Report)</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0 items-center">
            {/* Real Data Indicator */}
            {!isRealData ? (
                <span className="flex items-center text-amber-600 text-xs bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mr-2">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Mock Data Preview
                </span>
            ) : (
                <span className="flex items-center text-green-600 text-xs bg-green-50 px-3 py-1 rounded-full border border-green-200 mr-2">
                    <Activity className="w-3 h-3 mr-1" />
                    Real Data Loaded
                </span>
            )}

            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center text-sm shadow-sm">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent outline-none text-slate-600 font-medium cursor-pointer"
                >
                    <option value="2569-01">มกราคม 2569</option>
                    <option value="2569-02">กุมภาพันธ์ 2569</option>
                </select>
            </div>
          
            <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center ${!isXLSXLoaded ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4 mr-2" />
                {isXLSXLoaded ? 'Import Excel File' : 'Loading Library...'}
                <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    disabled={!isXLSXLoaded}
                />
            </label>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card 
          title="ผู้ป่วยนอกในเวลา" 
          value={processedData[0].totalToday.toLocaleString()} 
          subtext="ยอดรวมล่าสุด"
          isActive={activeTab === 0}
          onClick={() => setActiveTab(0)}
          colorClass="blue"
          icon={Users}
        />
        <Card 
          title="คลินิกพิเศษนอกเวลา" 
          value={processedData[1].totalToday.toLocaleString()} 
          subtext="ยอดรวมล่าสุด"
          isActive={activeTab === 1}
          onClick={() => setActiveTab(1)}
          colorClass="emerald"
          icon={Activity}
        />
        <Card 
          title="Premium Clinic" 
          value={processedData[2].totalToday.toLocaleString()} 
          subtext="ยอดรวมล่าสุด"
          isActive={activeTab === 2}
          onClick={() => setActiveTab(2)}
          colorClass="purple"
          icon={FileText}
        />
        <Card 
          title="ผู้ป่วยใน" 
          value={processedData[3].totalToday.toLocaleString()} 
          subtext="คงเหลือ + รับใหม่ + รับย้าย"
          isActive={activeTab === 3}
          onClick={() => setActiveTab(3)}
          colorClass="orange"
          icon={BedDouble}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">แนวโน้มผู้ป่วยรายวัน (Daily Trend)</h2>
            <div className="text-sm text-slate-500">
                ข้อมูลเดือน: {selectedMonth}
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    tickFormatter={(value) => {
                        // Try to format nicely if it's a date string
                        if(typeof value === 'string' && value.includes('-')) return value.split('-')[2];
                        return value;
                    }} 
                    stroke="#cbd5e1"
                />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} stroke="#cbd5e1" />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{color: '#475569', fontWeight: 'bold'}}
                    formatter={(value) => [value.toLocaleString(), 'จำนวนผู้ป่วย']}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="จำนวนผู้ป่วย (ราย)" 
                    stroke={
                        activeTab === 0 ? '#3b82f6' : 
                        activeTab === 1 ? '#10b981' : 
                        activeTab === 2 ? '#8b5cf6' : '#f97316'
                    } 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2, fill: '#fff'}}
                    activeDot={{r: 6}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detail Table Section */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2 md:mb-0">รายละเอียดรายแผนก (Department Details)</h2>
            
            {/* Table Controls */}
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button 
                        onClick={() => handleDateRangeChange('prev')}
                        disabled={dateRange.start === 0}
                        className="p-2 hover:bg-white rounded-md disabled:opacity-30 transition-all"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-3">
                        {currentData.dates[dateRange.start] || '-'} ถึง {currentData.dates[dateRange.end] || '-'}
                    </span>
                    <button 
                        onClick={() => handleDateRangeChange('next')}
                        disabled={dateRange.end >= currentData.dates.length - 1}
                        className="p-2 hover:bg-white rounded-md disabled:opacity-30 transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 font-bold sticky left-0 bg-slate-50 z-10 shadow-sm w-64 min-w-[200px]">แผนก / คลินิก</th>
                        {currentData.dates.slice(dateRange.start, dateRange.end + 1).map((date, idx) => (
                            <th key={idx} className="px-6 py-3 text-center min-w-[80px]">
                                {typeof date === 'string' ? date.split(' ')[0] : date}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {currentData.tableData.slice(0, 50).map((row, rIdx) => (
                        <tr key={rIdx} className="bg-white border-b hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 sticky left-0 bg-white shadow-sm border-r">
                                {row[1] || row[0] || 'Unknown'} {/* Name */}
                            </td>
                            {/* In normalizedTableData, index 0=code, 1=name, 2=date0, 3=date1... */}
                            {currentData.dates.slice(dateRange.start, dateRange.end + 1).map((_, dIdx) => {
                                const val = row[2 + dateRange.start + dIdx];
                                return (
                                    <td key={dIdx} className="px-6 py-4 text-center">
                                        {val !== undefined && val !== null ? val : '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {currentData.tableData.length === 0 && (
                        <tr>
                            <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>ไม่พบข้อมูล</p>
                                <p className="text-xs mt-1">กรุณา Import Excel File เพื่อแสดงข้อมูลจริง</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}