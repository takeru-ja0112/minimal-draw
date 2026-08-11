export default function Card({ id, children, className }: { id?: string, children: React.ReactNode, className?: string }) {
    return (
        <div
            id={id}
            className={` backdrop-blur-md bg-white/50 rounded-3xl border border-white border-2 shadow-md p-4 ${className}`}
        >
            {children}
        </div>
    );
}