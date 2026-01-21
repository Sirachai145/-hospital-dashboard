import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  Upload, Calendar, Users, Activity, FileText, 
  ChevronDown, PieChart, TrendingUp 
} from 'lucide-react';

// --- Mock Data Generator ---
const generateMockData = () => {
  const dates = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    return `2026-01-${day.toString().padStart(2, '0')}`;
  });

  const categories = [
    { id: 'opd_time', name: 'OPD ในเวลา & ER', color: '#3b82f6' },
    { id: 'opd_special', name: 'OPD คลินิกพิเศษ/นอกเวลา', color: '#10b981' },
    { id: 'opd_premium', name: 'OPD Premium Clinic', color: '#8b5cf6' },
    { id: 'ipd', name: 'ผู้ป่วยใน (IPD)', color: '#f59e0b' }
  ];

  const data = dates.map(date => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const multiplier = isWeekend ? 0.4 : 1.0;

    return {
      date: date,
      displayDate: new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }),
      opd_time: Math.floor((150 + Math.random() * 100) * multiplier),
      opd_special: Math.floor((40 + Math.random() * 30) * multiplier),
      opd_premium: Math.floor((20 + Math.random() * 20) * multiplier),
      ipd: Math.floor(180 + Math.random() * 20),
      
      details: {
        opd_time: [
          { name: 'อายุรกรรม', value: Math.floor((50 + Math.random() * 20) * multiplier) },
          { name: 'ศัลยกรรม', value: Math.floor((30 + Math.random() * 15) * multiplier) },
          { name: 'กุมารเวช', value: Math.floor((20 + Math.random() * 10) * multiplier) },
          { name: 'สูตินารี', value: Math.floor((15 + Math.random() * 10) * multiplier) },
          { name: 'กระดูกและข้อ', value: Math.floor((25 + Math.random() * 10) * multiplier) },
          { name: 'ER (ฉุกเฉิน)', value: Math.floor((20 + Math.random() * 30)) },
        ],
        opd_special: [
          { name: 'คลินิกนอกเวลา', value: Math.floor((20 + Math.random() * 10) * multiplier) },
          { name: 'ทันตกรรมพิเศษ', value: Math.floor((10 + Math.random() * 5) * multiplier) },
          { name: 'ผิวหนัง', value: Math.floor((10 + Math.random() * 5) * multiplier) },
        ],
        opd_premium: [
          { name: 'Premium Med', value: Math.floor((10 + Math.random() * 5) * multiplier) },
          { name: 'Premium Ped', value: Math.floor((5 + Math.random() * 5) * multiplier) },
        ],
        ipd: [
          { name: 'อายุรกรรมชาย', value: Math.floor(40 + Math.random() * 5) },
          { name: 'อายุรกรรมหญิง', value: Math.floor(45 + Math.random() * 5) },
          { name: 'ศัลยกรรมชาย', value: Math.floor(30 + Math.random() * 5) },
          { name: 'ICU', value: Math.floor(10 + Math.random() * 2) },
          { name: 'VIP', value: Math.floor(5 + Math.random() * 2) },
        ]
      }
    };
  });

  return { data, categories };
};

export default function HospitalDashboard() {
  const [rawData, setRawData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-20');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data, categories } = generateMockData();
    setRawData(data);
    setCategories(categories);
    setIsLoading(false);
  }, []);

  const currentDayData = useMemo(() => {
    return rawData.find(d => d.date === selectedDate) || rawData[0];
  }, [rawData, selectedDate]);

  const totalPatients = useMemo(() => {
    if (!currentDayData) return 0;
    return (
      currentDayData.opd_time + 
      currentDayData.opd_special + 
      currentDayData.opd_premium + 
      currentDayData.ipd
    );
  }, [currentDayData]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        alert(`อัปโหลดไฟล์ ${file.name} เรียบร้อยแล้ว (จำลอง)\nระบบจะทำการอ่านข้อมูลจากไฟล์ CSV และอัปเดต Dashboard`);
      }, 1000);
    }
  };

  const getChartData = () => {
    if (selectedCategory === 'all') {
      return currentDayData?.details?.opd_time?.concat(
        currentDayData?.details?.opd_special || [],
        currentDayData?.details?.opd_premium || [],
        currentDayData?.details?.ipd || []
      ).sort((a, b) => b.value - a.value).slice(0, 10) || [];
    }
    return currentDayData?.details?.[selectedCategory] || [];
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value?.toLocaleString()} <span className="text-sm font-normal text-slate-400">ราย</span></h3>
        {subtext && <p className={`text-xs mt-2 ${subtext > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
           {subtext > 0 ? '▲' : '▼'} {Math.abs(subtext)}% จากเมื่อวาน
        </p>}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500 font-sans">กำลังประมวลผลข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Hospital Daily Dashboard</h1>
                <p className="text-xs text-slate-500">รายงานข้อมูลผู้ป่วยรายวัน (ข้อมูล ณ วันที่ {currentDayData?.displayDate})</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input 
                  type="date" 
                  className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto text-slate-600"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min="2026-01-01"
                  max="2026-01-31"
                />
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import Excel/CSV</span>
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="ผู้ป่วยรวมทั้งหมด" value={totalPatients} icon={Users} color="text-blue-600 bg-blue-600" subtext={2.5} />
          <StatCard title="OPD ในเวลา & ER" value={currentDayData?.opd_time || 0} icon={FileText} color="text-emerald-600 bg-emerald-600" />
           <StatCard title="OPD คลินิกพิเศษ" value={(currentDayData?.opd_special || 0) + (currentDayData?.opd_premium || 0)} icon={TrendingUp} color="text-purple-600 bg-purple-600" />
          <StatCard title="ผู้ป่วยใน (IPD)" value={currentDayData?.ipd || 0} icon={PieChart} color="text-amber-500 bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" /> แนวโน้มผู้ป่วยตลอดเดือน</h2>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> OPD</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> IPD</div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rawData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" tick={{fontSize: 10, fill: '#64748b'}} tickMargin={10} minTickGap={30} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="opd_time" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="ipd" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-800">สัดส่วนแยกตามแผนก</h2>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">แสดง Top 10 แผนก (รวม)</option>
                  <option value="opd_time">OPD ในเวลา & ER</option>
                  <option value="opd_special">OPD คลินิกพิเศษ</option>
                  <option value="opd_premium">OPD Premium</option>
                  <option value="ipd">ผู้ป่วยใน (IPD)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={getChartData()} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#475569'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> ข้อมูลรายคลินิก</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 w-1/3">ชื่อคลินิก / แผนก</th>
                  <th className="px-6 py-3">ประเภท</th>
                  <th className="px-6 py-3 text-right">จำนวนผู้ป่วย (ราย)</th>
                  <th className="px-6 py-3 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getChartData().length > 0 ? (
                  getChartData().map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-700">{item.name}</td>
                      <td className="px-6 py-3 text-slate-500">ทั่วไป</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-700">{item.value}</td>
                      <td className="px-6 py-3 text-right"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.value > 40 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{item.value > 40 ? 'หนาแน่น' : 'ปกติ'}</span></td>
                    </tr>
                  ))
                ) : (<tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">ไม่พบข้อมูล</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

