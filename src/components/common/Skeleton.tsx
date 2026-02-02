interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    className?: string;
}

const Skeleton = ({
    variant = 'rectangular',
    width,
    height,
    className = ''
}: SkeletonProps) => {
    const baseStyles = 'skeleton';

    const variantStyles = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-xl'
    };

    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
    };

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={style}
        />
    );
};

// Pre-made skeleton components
export const SkeletonCard = () => (
    <div className="bg-dark-800 rounded-2xl overflow-hidden border border-white/5">
        <Skeleton className="aspect-4-5 w-full" />
        <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
        </div>
    </div>
);

export const SkeletonProfile = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={80} height={80} />
            <div className="flex-1 space-y-2">
                <Skeleton width="50%" height={20} />
                <Skeleton width="30%" height={14} />
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
            ))}
        </div>
    </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
        ))}
    </div>
);

export default Skeleton;
