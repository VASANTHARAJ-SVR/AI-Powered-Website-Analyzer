export default function Loader() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>
                <p className="text-white text-lg">Loading report...</p>
            </div>
        </div>
    );
}
