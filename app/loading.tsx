export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 z-50">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xl font-bold text-blue-700 animate-pulse">Loading Game Lobby...</span>
      </div>
    </div>
  );
} 