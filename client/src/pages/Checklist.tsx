import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/Button';
import { 
  ClipboardList, Search, 
  School, Sparkles, HelpCircle 
} from 'lucide-react';

export const Checklist: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const [grade, setGrade] = React.useState<string>(user?.defaultGrade?.toString() || '1');
  const [checklistData, setChecklistData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchChecklist = async () => {
    if (!user?.schoolId) return;
    try {
      setLoading(true);
      const res = await api.get(`/schools/${user.schoolId}/checklist`, {
        params: { grade }
      });
      setChecklistData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch school checklist', err);
      addToast(
        err.response?.data?.error?.message || 'Could not fetch school checklist list', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.schoolId) {
      fetchChecklist();
    }
  }, [grade, user?.schoolId]);

  if (!user?.schoolId) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white border border-slate-100 rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="bg-amber-50 p-4 rounded-full text-amber-500">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">School Link Required</h3>
        <p className="text-slate-500 text-sm">
          Please link your profile to a school in your profile onboarding settings before viewing supply checklists.
        </p>
        <Button onClick={() => navigate('/onboarding')}>Link School Now</Button>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    textbook: 'Textbook',
    uniform_top: 'Uniform Shirt',
    uniform_bottom: 'Uniform Bottom',
    shoes: 'School Shoes',
    bag: 'School Bag',
    stationery: 'Stationery',
    other: 'Other Item',
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 text-primary-600 p-3 rounded-xl shadow-sm">
            <ClipboardList size={24} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-black text-slate-800">Supply Checklists</h1>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <School size={14} className="text-primary-600" />
              {checklistData?.schoolName || 'Your School Network'}
            </span>
          </div>
        </div>

        {/* Grade standard picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Select standard:</span>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-600 shadow-sm"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Class {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Checklist Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <span className="text-sm text-slate-500">Retrieving official school books & supply lists...</span>
        </div>
      ) : !checklistData?.checklist || checklistData.checklist.length === 0 ? (
        <div className="text-center bg-white border border-slate-100 rounded-2xl p-12 flex flex-col items-center gap-4">
          <ClipboardList size={32} className="text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">Checklist Empty</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            No supply items have been officially uploaded for Class {grade} yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-primary-50/30 border border-primary-100/50 p-3.5 rounded-xl font-medium">
            <Sparkles size={14} className="text-amber-500 animate-pulse flex-shrink-0" />
            Below are the recommended books and uniforms for Class {grade}. Tap "Find Secondhand" to browse active local parent swaps inside your school network.
          </div>

          <div className="grid gap-3.5">
            {checklistData.checklist.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 hover:border-primary-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 text-sm md:text-base">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-100 rounded px-2 py-0.5 w-max uppercase tracking-wider">
                      {categoryLabels[item.category] || item.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <Link 
                  to={`/feed?category=${item.category}&grade=${grade}&search=${encodeURIComponent(item.name)}`}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1.5 text-xs font-bold border-primary-200 text-primary-600 bg-primary-50/50 hover:bg-primary-50 rounded-full px-4 h-9 touch-target"
                  >
                    <Search size={13} />
                    <span className="hidden sm:inline">Find Secondhand</span>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
