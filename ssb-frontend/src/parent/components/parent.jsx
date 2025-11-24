import React from "react";

export default function ParentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Parent View</h2>
          <div className="text-sm text-gray-400">Theo dõi con, thông báo</div>
        </div>
        <div className="text-sm text-gray-300">Trạng thái: Con đang trên xe</div>
      </div>

      <div className="bg-[#141414] p-4 rounded-xl border border-[#202020]">
        <h4 className="text-sm text-gray-300 mb-2">Thông tin học sinh</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400">Họ tên</div>
            <div className="text-sm text-gray-200">Nguyễn Văn X</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Lớp</div>
            <div className="text-sm text-gray-200">3A</div>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] p-4 rounded-xl border border-[#202020]">
        <h4 className="text-sm text-gray-300 mb-2">Vị trí xe</h4>
        <p className="text-gray-300">Xe buýt 01 • Dự kiến đến: 07:40</p>
      </div>
    </div>
  );
}