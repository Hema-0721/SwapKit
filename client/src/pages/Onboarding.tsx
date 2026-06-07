import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search, MapPin, Plus, GraduationCap } from 'lucide-react';

interface SchoolResult {
  _id: string;
  name: string;
  board: string;
  city: string;
  state: string;
  pincode: string;
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [selectedSchool, setSelectedSchool] = React.useState<SchoolResult | null>(null);
  const [defaultGrade, setDefaultGrade] = React.useState(user?.defaultGrade || 1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SchoolResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isCreatingSchool, setIsCreatingSchool] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // New School Form
  const [newSchoolName, setNewSchoolName] = React.useState('');
  const [newSchoolBoard, setNewSchoolBoard] = React.useState('cbse');
  const [newSchoolCity, setNewSchoolCity] = React.useState('');
  const [newSchoolState, setNewSchoolState] = React.useState('');
  const [newSchoolPincode, setNewSchoolPincode] = React.useState('');

  // Search Schools debounce
  React.useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/schools/search?q=${searchQuery}`);
        setSearchResults(res.data.schools);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectSchool = (school: SchoolResult) => {
    setSelectedSchool(school);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolCity || !newSchoolState || !newSchoolPincode) {
      addToast('Please fill all school fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Mock coordinates
      const mockLong = 78.0 + Math.random();
      const mockLat = 20.0 + Math.random();

      const res = await api.post('/schools', {
        name: newSchoolName,
        board: newSchoolBoard,
        city: newSchoolCity,
        state: newSchoolState,
        pincode: newSchoolPincode,
        longitude: mockLong,
        latitude: mockLat,
      });

      setSelectedSchool(res.data.school);
      setIsCreatingSchool(false);
      addToast('School registered successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || 'Failed to create school', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('Display name is required', 'error');
      return;
    }
    if (!selectedSchool) {
      addToast('Please select or register your school', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.put('/auth/me', {
        displayName: displayName.trim(),
        schoolId: selectedSchool._id,
        defaultGrade,
      });

      updateUser(res.data.user);
      addToast('Profile setup complete!', 'success');
      navigate('/feed');
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-2xl font-black text-slate-800">Set Up Your Profile</h2>
          <p className="text-slate-500 text-sm">
            Help us customize your school supply feed by sharing your details.
          </p>
        </div>

        <form onSubmit={handleCompleteOnboarding} className="flex flex-col gap-6">
          {/* Display Name */}
          <Input
            label="Your Display Name"
            placeholder="Priya Sharma"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            required
          />

          {/* Grade selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <GraduationCap size={16} />
              Default Academic Class (Grade)
            </label>
            <select
              value={defaultGrade}
              onChange={(e) => setDefaultGrade(Number(e.target.value))}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 touch-target"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Class {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* School selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin size={16} />
              Associated School Community
            </label>

            {selectedSchool ? (
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedSchool.name}</h4>
                  <p className="text-xs text-slate-500 capitalize">
                    Board: {selectedSchool.board.toUpperCase()} • {selectedSchool.city}, {selectedSchool.state} ({selectedSchool.pincode})
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSchool(null)}
                  disabled={isLoading}
                >
                  Change
                </Button>
              </div>
            ) : !isCreatingSchool ? (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input
                    placeholder="Search schools by name or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                  />
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                </div>

                {isSearching && <p className="text-xs text-slate-500">Searching directory...</p>}

                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-slate-100 shadow-inner">
                    {searchResults.map((school) => (
                      <button
                        key={school._id}
                        type="button"
                        onClick={() => handleSelectSchool(school)}
                        className="w-full text-left p-3 hover:bg-slate-50 flex flex-col transition-colors"
                      >
                        <span className="font-semibold text-slate-800 text-sm">{school.name}</span>
                        <span className="text-xs text-slate-500 capitalize">
                          {school.board.toUpperCase()} • {school.city}, {school.state}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim().length >= 3 && searchResults.length === 0 && !isSearching && (
                  <div className="text-center p-4 bg-slate-50 border rounded-lg flex flex-col gap-2">
                    <p className="text-sm text-slate-500">Can't find your school in our directory?</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingSchool(true)}
                      className="self-center flex items-center gap-1"
                    >
                      <Plus size={14} /> Register New School
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 border border-slate-200 rounded-xl flex flex-col gap-4">
                <h4 className="font-bold text-slate-800 text-sm">Register New School</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="School Name"
                    placeholder="Delhi Public School"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Educational Board</label>
                    <select
                      value={newSchoolBoard}
                      onChange={(e) => setNewSchoolBoard(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 touch-target"
                    >
                      <option value="cbse">CBSE</option>
                      <option value="icse">ICSE</option>
                      <option value="state">State Board</option>
                      <option value="ib">IB</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input
                    label="City"
                    placeholder="Nagpur"
                    value={newSchoolCity}
                    onChange={(e) => setNewSchoolCity(e.target.value)}
                    required
                  />
                  <Input
                    label="State"
                    placeholder="Maharashtra"
                    value={newSchoolState}
                    onChange={(e) => setNewSchoolState(e.target.value)}
                    required
                  />
                  <Input
                    label="Pincode (6 digits)"
                    placeholder="440001"
                    value={newSchoolPincode}
                    onChange={(e) => setNewSchoolPincode(e.target.value.replace(/[^\d]/g, '').substring(0, 6))}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatingSchool(false)}
                    disabled={isLoading}
                  >
                    Cancel Search
                  </Button>
                  <Button type="button" onClick={handleCreateSchoolSubmit} isLoading={isLoading}>
                    Add School
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full py-3 mt-4"
            disabled={!selectedSchool || !displayName.trim() || isLoading}
            isLoading={isLoading}
          >
            Complete Onboarding
          </Button>
        </form>
      </div>
    </div>
  );
};
