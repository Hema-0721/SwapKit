import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, RefreshCw, Eye } from 'lucide-react';
import { StarRating } from './StarRating';

export interface ListingCardProps {
  id: string;
  title: string;
  category: string;
  grade: number;
  condition: 'like_new' | 'good' | 'fair' | 'worn';
  mode: 'sell' | 'barter' | 'free';
  pricePaise?: number;
  barterWantCategory?: string;
  barterWantSubject?: string;
  barterWantGrade?: number;
  images: string[];
  isBoosted?: boolean;
  viewCount?: number;
  sellerName?: string;
  sellerRating?: number;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  category,
  grade,
  condition,
  mode,
  pricePaise,
  barterWantCategory,
  barterWantSubject,
  barterWantGrade,
  images,
  isBoosted = false,
  viewCount = 0,
  sellerName,
  sellerRating,
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60';
  const displayImage = images[0] || fallbackImage;

  const modeBadges = {
    sell: { bg: 'bg-emerald-100 text-emerald-800', label: 'For Sale' },
    barter: { bg: 'bg-amber-100 text-amber-900', label: 'Barter Swap' },
    free: { bg: 'bg-blue-100 text-blue-800', label: 'Free Donation' },
  };

  const conditionLabels = {
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    worn: 'Worn',
  };

  const formattedPrice = pricePaise 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(pricePaise / 100) 
    : 'Free';

  return (
    <div className={`relative flex flex-col bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border ${isBoosted ? 'border-primary-600' : 'border-slate-100'} animate-fade-in`}>
      {isBoosted && (
        <span className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
          Promoted
        </span>
      )}
      
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${modeBadges[mode].bg}`}>
            {modeBadges[mode].label}
          </span>
          <span className="text-[11px] font-medium bg-slate-900/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
            Grade {grade}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-grow p-4 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 capitalize">
          <span>{category.replace('_', ' ')}</span>
          <span>•</span>
          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{conditionLabels[condition]}</span>
        </div>

        <Link to={`/listings/${id}`} className="hover:text-primary-600 transition-colors">
          <h3 className="font-bold text-slate-800 line-clamp-1 text-base">{title}</h3>
        </Link>

        {mode === 'sell' && (
          <div className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
            <Tag size={16} className="text-emerald-600" />
            <span>{formattedPrice}</span>
          </div>
        )}

        {mode === 'barter' && (
          <div className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
            <RefreshCw size={14} className="mt-0.5 flex-shrink-0" />
            <div className="line-clamp-2">
              <span className="font-semibold">Wants:</span> Grade {barterWantGrade || grade} {barterWantCategory?.replace('_', ' ')}
              {barterWantSubject && ` (${barterWantSubject})`}
            </div>
          </div>
        )}

        {mode === 'free' && (
          <div className="text-lg font-bold text-blue-600">
            <span>Free Donation</span>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {sellerName ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-slate-700">{sellerName}</span>
              {sellerRating !== undefined && sellerRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating rating={sellerRating} size={11} />
                  <span>({sellerRating})</span>
                </div>
              )}
            </div>
          ) : (
            <span>School Verified</span>
          )}

          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Eye size={12} />
            <span>{viewCount} views</span>
          </div>
        </div>
      </div>
    </div>
  );
};
