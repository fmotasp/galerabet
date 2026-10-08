import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

const oldModal = `<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[95vh] h-full sm:h-auto sm:min-h-[600px] bg-[#101010] text-white rounded-2xl shadow-2xl border border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-300 ease-out">
        <TaskModalHeader`;

const newModal = `<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl h-[calc(100vh-2rem)] sm:h-auto sm:max-h-[95vh] sm:min-h-[600px] bg-[#101010] text-white rounded-t-[32px] sm:rounded-2xl shadow-2xl border-t sm:border border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 ease-out">
        {/* Mobile Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0 bg-[#101010]">
          <div className="w-12 h-1.5 bg-white/15 rounded-full" />
        </div>

        <TaskModalHeader`;

content = content.replace(oldModal, newModal);
fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);

