import React from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { ListingCard } from '../components/ListingCard';
import { Button } from '../components/Button';
import { StarRating } from '../components/StarRating';
import { 
  User as UserIcon, BookOpen, Star, 
  MapPin, ShieldCheck, PenTool 
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get('userId') || currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;

  // Profile metadata
  const [profileUser, setProfileUser] = React.useState<any>(null);
  const [listings, setListings] = React.useState<any[]>([]);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'listings' | 'reviews'>('listings');
  const [isLoading, setIsLoading] = React.useState(true);

  // Review form state
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [selectedListingId, setSelectedListingId] = React.useState('');
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  // Load router state for seller details if navigated from listing details
  React.useEffect(() => {
    const state = location.state as { seller?: any } | null;
    if (state?.seller && state.seller._id === userId) {
      setProfileUser(state.seller);
    }
  }, [location.state, userId]);

  const loadProfileData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // Fetch reviews and listings in parallel with indexed sellerId queries
      const [reviewRes, listingsRes] = await Promise.all([
        api.get(`/reviews/user/${userId}`),
        api.get('/listings', { params: { sellerId: userId } })
      ]);

      const userReviews = reviewRes.data.reviews || [];
      const userListings = listingsRes.data.listings || [];

      setReviews(userReviews);
      setListings(userListings);

      // Set user info
      if (isOwnProfile) {
        setProfileUser(currentUser);
      } else if (!profileUser) {
        // Fallback: search for seller details from their listings
        if (userListings.length > 0 && userListings[0].sellerId) {
          setProfileUser(userListings[0].sellerId);
        } else {
          // If no listings or reviews, construct a mock profile structure
          setProfileUser({
            displayName: 'SchoolSwap Member',
            ratingAvg: 0,
            ratingCount: 0,
            isNgo: false,
            isPro: false,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
      addToast('Failed to load profile details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfileData();
  }, [userId, currentUser]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingId) {
      addToast('Please select a listing to review', 'error');
      return;
    }
    if (!reviewComment.trim()) {
      addToast('Please enter a comment', 'error');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await api.post('/reviews', {
        revieweeId: userId,
        listingId: selectedListingId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      addToast('Review submitted successfully!', 'success');
      setShowReviewForm(false);
      setReviewComment('');
      setSelectedListingId('');
      // Reload profile
      loadProfileData();
    } catch (err: any) {
      console.error('Failed to submit review', err);
      addToast(
        err.response?.data?.error?.message || 'Failed to submit review', 
        'error'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading && !profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        <span className="text-sm text-slate-500">Loading profile...</span>
      </div>
    );
  }

  const ratingAvg = profileUser?.ratingAvg || 0;
  const ratingCount = profileUser?.ratingCount || reviews.length || 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-8">
      {/* Header Profile Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
        {/* Background gradient blob */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50/50 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shadow-inner">
              <UserIcon size={48} className="stroke-[1.5]" />
            </div>
            {profileUser?.isNgo && (
              <span className="absolute -bottom-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                NGO
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
              {profileUser?.displayName || 'SchoolSwap Member'}
              {profileUser?.isNgo && (
                <ShieldCheck size={20} className="text-primary-600 fill-primary-50" />
              )}
            </h1>

            {/* School network */}
            <span className="text-sm text-slate-500 font-medium flex items-center justify-center md:justify-start gap-1">
              <MapPin size={16} className="text-slate-400" />
              Verified Campus parent
            </span>

            {/* Star ratings details */}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <StarRating rating={ratingAvg} size={16} />
              <span className="text-sm font-bold text-slate-700">
                {ratingAvg > 0 ? `${ratingAvg} / 5` : 'No ratings'}
              </span>
              <span className="text-xs text-slate-400">
                ({ratingCount} reviews)
              </span>
            </div>

            {/* Privacy note */}
            {isOwnProfile && currentUser?.phoneHash && (
              <div className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100/50 max-w-sm">
                <span className="font-bold">Encrypted Phone Hash:</span> {currentUser.phoneHash.substring(0, 16)}...
              </div>
            )}
          </div>
        </div>

        {/* Buttons / Actions */}
        {!isOwnProfile && listings.length > 0 && (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center justify-center gap-1.5 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              <PenTool size={16} /> Write Review
            </Button>
          </div>
        )}
      </div>

      {/* Review Submission Form Section */}
      {showReviewForm && !isOwnProfile && (
        <div className="bg-white border border-primary-100 rounded-2xl p-6 shadow-md shadow-primary-50/20 animate-fade-in flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Star className="text-amber-500 fill-amber-500" size={18} />
            Leave a Review for {profileUser?.displayName}
          </h3>

          <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
            {/* Listing Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="listing-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select swapped item
              </label>
              <select
                id="listing-select"
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-600"
                required
              >
                <option value="">-- Choose a Listing --</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            {/* Rating Stars Input */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rating Score</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      size={24} 
                      className={star <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Area */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-comment" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Detailed Feedback
              </label>
              <textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the exchange? Were the books in the described condition? Was the parent punctual?"
                rows={3}
                className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-600"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReviewForm(false)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                isLoading={isSubmittingReview}
              >
                Submit Review
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex flex-col gap-6">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 text-sm font-bold transition-all relative
              ${activeTab === 'listings' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {isOwnProfile ? 'My Listings' : 'Active Listings'} ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold transition-all relative
              ${activeTab === 'reviews' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Reviews Received ({reviews.length})
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'listings' ? (
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center gap-3">
                <BookOpen size={32} className="stroke-1 text-slate-400" />
                <h4 className="font-bold text-slate-700">No Listings Posted</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  {isOwnProfile 
                    ? "You haven't listed any school supplies for exchange yet." 
                    : "This parent has no active marketplace listings."
                  }
                </p>
                {isOwnProfile && (
                  <Button size="sm" className="mt-2" onClick={() => navigate('/listings/new')}>
                    Post First Item
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <ListingCard
                    key={item.id || item._id}
                    id={item.id || item._id}
                    title={item.title}
                    category={item.category}
                    grade={item.grade}
                    condition={item.condition}
                    mode={item.mode}
                    pricePaise={item.pricePaise}
                    barterWantCategory={item.barterWantCategory}
                    barterWantSubject={item.barterWantSubject}
                    barterWantGrade={item.barterWantGrade}
                    images={item.images}
                    isBoosted={item.isBoosted}
                    viewCount={item.viewCount}
                    sellerName={profileUser?.displayName}
                    sellerRating={ratingAvg}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center gap-3">
                <Star size={32} className="stroke-1 text-slate-400" />
                <h4 className="font-bold text-slate-700">No Reviews Yet</h4>
                <p className="text-xs text-slate-400">
                  {isOwnProfile 
                    ? "You haven't received any reviews from other parents yet." 
                    : "No swap reviews have been posted for this parent."
                  }
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id || rev._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {rev.reviewerId?.displayName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">
                            {rev.reviewerId?.displayName || 'SchoolSwap Member'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-0.5">
                        <StarRating rating={rev.rating} size={12} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 pl-10 italic">
                      "{rev.comment}"
                    </p>

                    {rev.listingId && (
                      <div className="mt-1 pl-10 text-[10px] text-slate-400 font-medium">
                        Swapped item: <span className="text-slate-600 font-semibold">{rev.listingId.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
