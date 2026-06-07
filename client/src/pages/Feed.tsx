import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { ListingCard } from '../components/ListingCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Search } from 'lucide-react';

export const Feed: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Search & Filter state
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [grade, setGrade] = React.useState<string>(searchParams.get('grade') || user?.defaultGrade?.toString() || '');
  const [category, setCategory] = React.useState(searchParams.get('category') || '');
  const [mode, setMode] = React.useState(searchParams.get('mode') || '');

  // Sync state with URL params when URL changes
  React.useEffect(() => {
    const qSearch = searchParams.get('search');
    const qGrade = searchParams.get('grade');
    const qCategory = searchParams.get('category');
    const qMode = searchParams.get('mode');

    if (qSearch !== null) setSearch(qSearch);
    if (qGrade !== null) setGrade(qGrade);
    if (qCategory !== null) setCategory(qCategory);
    if (qMode !== null) setMode(qMode);
  }, [searchParams]);

  // Sync state back to URL params when filters change
  React.useEffect(() => {
    const params: any = {};
    if (grade) params.grade = grade;
    if (category) params.category = category;
    if (mode) params.mode = mode;
    if (search.trim()) params.search = search.trim();
    setSearchParams(params, { replace: true });
  }, [grade, category, mode]);


  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (grade) params.grade = grade;
      if (category) params.category = category;
      if (mode) params.mode = mode;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/listings', { params });
      setListings(res.data.listings);
    } catch (err) {
      console.error('Failed to load listings', err);
      addToast('Failed to load marketplace feed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search on filter changes or manual submit
  React.useEffect(() => {
    fetchListings();
  }, [grade, category, mode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  // Listen for real-time barter match events from socket
  React.useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBarterMatch = (data: any) => {
      addToast(`🎉 Barter Match Found! Your listing "${data.myListing.title}" matches with "${data.matchedListing.title}"!`, 'success');
    };

    socket.on('barterMatch', handleBarterMatch);

    return () => {
      socket.off('barterMatch', handleBarterMatch);
    };
  }, [addToast]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-6">
      {/* Header section with CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Supply Exchange</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse verified school supplies listed by parents in your school community.
          </p>
        </div>
        <Link to="/listings/new">
          <Button className="rounded-full shadow-md flex items-center gap-1">
            <Plus size={18} /> Post Supply Listing
          </Button>
        </Link>
      </div>

      {/* Search and Filters grid */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-grow">
            <Input
              placeholder="Search by title, subject (e.g. Maths, Science)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 mb-0"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          </div>
          <Button type="submit" variant="primary" className="px-5">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Grade filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class (Grade)</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-600 touch-target"
            >
              <option value="">All Grades</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Class {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-600 touch-target"
            >
              <option value="">All Categories</option>
              <option value="textbook">Textbooks</option>
              <option value="uniform_top">Uniform Shirts/Tops</option>
              <option value="uniform_bottom">Uniform Pants/Skirts</option>
              <option value="shoes">School Shoes</option>
              <option value="bag">School Bags</option>
              <option value="stationery">Stationery / Geometry</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Mode filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exchange Mode</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-600 touch-target"
            >
              <option value="">All Modes</option>
              <option value="sell">For Sale (Cash)</option>
              <option value="barter">Barter Swap</option>
              <option value="free">Donation (Free)</option>
            </select>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setGrade('');
              setCategory('');
              setMode('');
            }}
            className="self-end rounded-lg h-9 border-dashed border-slate-300 text-slate-500"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Listings feed grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <span className="text-sm text-slate-500">Loading marketplace feed...</span>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center bg-white border rounded-2xl p-12 flex flex-col items-center gap-4">
          <div className="bg-slate-100 p-4 rounded-full text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Listings Found</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            We couldn't find any listings matching your search parameters. Try changing filters or post a new item!
          </p>
          <Link to="/listings/new">
            <Button size="sm">Create First Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((item) => (
            <ListingCard
              key={item._id}
              id={item._id}
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
              sellerName={item.sellerId?.displayName}
              sellerRating={item.sellerId?.ratingAvg}
            />
          ))}
        </div>
      )}
    </div>
  );
};
