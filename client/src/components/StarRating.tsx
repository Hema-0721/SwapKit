import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  onRatingChange,
  size = 20,
  readonly = true,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    if (!readonly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(index);
    }
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= activeRating;

        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer focus:outline-none transition-transform hover:scale-110'} p-0.5`}
          >
            <Star
              size={size}
              className={`${
                isActive
                  ? 'fill-amber-400 stroke-amber-500'
                  : 'fill-slate-100 stroke-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
