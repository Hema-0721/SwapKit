import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { StarRating } from '../components/StarRating';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  ArrowLeft, Tag, RefreshCw, Heart, Eye, User as UserIcon, 
  MessageSquare, Sparkles, AlertCircle, Calendar, ShieldCheck 
} from 'lucide-react';

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [listing, setListing] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [chatMessage, setChatMessage] = React.useState('Hi, is this still available?');
  const [isSubmittingChat, setIsSubmittingChat] = React.useState(false);
  const [isBoosting, setIsBoosting] = React.useState(false);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/listings/${id}`);
      setListing(res.data.listing);
    } catch (err: any) {
      console.error('Failed to fetch listing details', err);
      addToast(
        err.response?.data?.error?.message || 'Failed to load listing details', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) {
      fetchListingDetails();
    }
  }, [id]);

  const handleBoost = async () => {
    if (!id) return;
    try {
      setIsBoosting(true);
      const res = await api.post(`/listings/${id}/boost`);
      setListing(res.data.listing);
      addToast('🎉 Listing boosted successfully! Your item is now pinned to the top of search results.', 'success');
    } catch (err: any) {
      console.error('Failed to boost listing', err);
      addToast(
        err.response?.data?.error?.message || 'Payment processing failed or verification failed', 
        'error'
      );
    } finally {
      setIsBoosting(false);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!chatMessage.trim()) {
      addToast('Please enter a message', 'error');
      return;
    }

    try {
      setIsSubmittingChat(true);
      const res = await api.post('/chats/messages', {
        listingId: id,
        message: chatMessage.trim()
      });
      addToast('Conversation started!', 'success');
      // Redirect to chats page with thread details if available
      navigate('/chats', { state: { activeThreadId: res.data.message.threadId } });
    } catch (err: any) {
      console.error('Failed to send message', err);
      addToast(
        err.response?.data?.error?.message || 'Could not initiate chat with seller', 
        'error'
      );
    } finally {
      setIsSubmittingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        <span className="text-sm text-slate-500">Loading details...</span>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center bg-white border border-slate-100 rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="bg-red-50 p-4 rounded-full text-red-500">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Listing Not Found</h3>
        <p className="text-slate-500 text-sm">
          The listing may have expired, been sold, or deleted by the owner.
        </p>
        <Button onClick={() => navigate('/feed')}>Return to Feed</Button>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId?._id || user?.id === listing.sellerId;
  const fallbackImage = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=80';
  const images = listing.images && listing.images.length > 0 ? listing.images : [fallbackImage];

  const modeBadges = {
    sell: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'For Sale' },
    barter: { bg: 'bg-amber-100 text-amber-900 border-amber-200', label: 'Barter Swap' },
    free: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Free Donation' },
  };

  const conditionLabels = {
    like_new: 'Like New (Very light use, no writing)',
    good: 'Good (Slight wear, perfectly readable)',
    fair: 'Fair (Visible wear, some markings)',
    worn: 'Worn (Significant usage, intact pages)',
  };

  const formattedPrice = listing.pricePaise 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(listing.pricePaise / 100) 
    : 'Free';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-6">
      {/* Back to feed button */}
      <div>
        <button 
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Marketplace
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left: Images Column */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 shadow-sm">
            {listing.isBoosted && (
              <span className="absolute top-4 left-4 z-10 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} className="text-amber-300" /> Promoted Listing
              </span>
            )}
            <img 
              src={images[activeImageIndex]} 
              alt={listing.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 bg-slate-100 flex-shrink-0 transition-all
                    ${activeImageIndex === idx ? 'border-primary-600 scale-95 shadow-sm' : 'border-transparent hover:border-slate-300'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details Column */}
        <div className="flex flex-col gap-6 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
          {/* Main tags & Title */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-full font-semibold border ${modeBadges[listing.mode as 'sell' | 'barter' | 'free']?.bg || ''}`}>
                {modeBadges[listing.mode as 'sell' | 'barter' | 'free']?.label || ''}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
                Class/Grade {listing.grade}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold capitalize">
                {listing.category.replace('_', ' ')}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-snug mt-1">
              {listing.title}
            </h1>

            {listing.subject && (
              <span className="text-slate-500 font-medium text-sm">
                Subject: <span className="font-semibold text-slate-700">{listing.subject}</span>
              </span>
            )}
          </div>

          {/* Pricing & Exchange details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            {listing.mode === 'sell' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">Selling Price</span>
                <div className="flex items-center gap-1.5 text-2xl font-black text-slate-900">
                  <Tag className="text-emerald-600" size={20} />
                  <span>{formattedPrice}</span>
                </div>
              </div>
            )}

            {listing.mode === 'barter' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-sm text-amber-800 font-bold">
                  <RefreshCw size={16} /> Barter Requirement
                </div>
                <div className="text-sm text-slate-700 mt-1 pl-5">
                  Looking to swap for a:
                  <ul className="list-disc pl-5 mt-1 font-semibold text-slate-800 flex flex-col gap-0.5">
                    <li>Category: <span className="capitalize">{listing.barterWantCategory?.replace('_', ' ') || 'Any'}</span></li>
                    {listing.barterWantGrade && <li>Target Grade: Class {listing.barterWantGrade}</li>}
                    {listing.barterWantSubject && <li>Subject: {listing.barterWantSubject}</li>}
                  </ul>
                </div>
              </div>
            )}

            {listing.mode === 'free' && (
              <div className="flex items-center gap-2 text-primary-600 font-bold">
                <Heart size={18} className="fill-primary-600" />
                <span>Free Donation / NGO Support</span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Item Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 text-xs">Condition</span>
                <span className="font-semibold text-slate-800">{conditionLabels[listing.condition as keyof typeof conditionLabels] || listing.condition}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 text-xs">School Network</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-primary-600 flex-shrink-0" />
                  {listing.schoolId?.name || 'School Verified'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 text-xs">Views</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Eye size={14} /> {listing.viewCount} views
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 text-xs">Listed On</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar size={14} /> {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Seller Notes</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {listing.description}
              </p>
            </div>
          )}

          {/* Seller Profile Card & Action CTA */}
          <div className="border-t border-slate-100 pt-6 mt-2 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Seller Information</h3>
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 text-primary-600 p-2.5 rounded-full">
                  <UserIcon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">
                    {listing.sellerId?.displayName || 'SchoolSwap Member'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                    {listing.sellerId?.ratingAvg !== undefined && listing.sellerId.ratingAvg > 0 ? (
                      <>
                        <StarRating rating={listing.sellerId.ratingAvg} size={12} />
                        <span>({listing.sellerId.ratingAvg} / 5)</span>
                      </>
                    ) : (
                      <span>No ratings yet</span>
                    )}
                  </div>
                </div>
              </div>

              {listing.sellerId?._id && (
                <Link 
                  to={`/profile?userId=${listing.sellerId._id}`} 
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                >
                  View Profile
                </Link>
              )}
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="flex flex-col gap-3">
                {listing.isBoosted ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500 animate-pulse" />
                    This listing is boosted and promoted. It has higher visibility in user feeds!
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 shadow-md shadow-primary-600/10"
                    onClick={handleBoost}
                    isLoading={isBoosting}
                  >
                    <Sparkles size={18} className="text-amber-300" />
                    Boost Listing for ₹99
                  </Button>
                )}
                <p className="text-[11px] text-slate-400 text-center">
                  *Promoting will boost views in search results. Payments are currently mock-verified for testing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleStartChat} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="chatMsg" className="text-xs font-bold text-slate-500">
                    Send a Message
                  </label>
                  <Input
                    id="chatMsg"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Hi, is this still available?"
                    className="mb-0 text-sm"
                    disabled={isSubmittingChat}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 shadow-md"
                  isLoading={isSubmittingChat}
                >
                  <MessageSquare size={18} />
                  Chat with Parent
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
