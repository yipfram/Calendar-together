
export function RoomsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/10 animate-pulse">
                    <div className="h-6 w-1/3 bg-white/10 rounded mb-4"></div>
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                </div>
            ))}
        </div>
    );
}
