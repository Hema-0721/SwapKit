import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

export const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('textbook');
  const [subject, setSubject] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [condition, setCondition] = React.useState<'like_new' | 'good' | 'fair' | 'worn'>('good');
  const [mode, setMode] = React.useState<'sell' | 'barter' | 'free'>('sell');
  const [priceRupees, setPriceRupees] = React.useState('');
  const [barterWantCategory, setBarterWantCategory] = React.useState('textbook');
  const [barterWantSubject, setBarterWantSubject] = React.useState('');
  const [barterWantGrade, setBarterWantGrade] = React.useState(user?.defaultGrade?.toString() || '1');
  
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalImages = selectedImages.length + filesArray.length;

      if (totalImages > 4) {
        addToast('You can upload a maximum of 4 photos', 'error');
        return;
      }

      setSelectedImages((prev) => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    
    // Revoke object url to avoid leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        addToast('Title is required', 'error');
        return;
      }
    }
    if (step === 3) {
      if (mode === 'sell') {
        const p = Number(priceRupees);
        if (isNaN(p) || p <= 0) {
          addToast('Please enter a valid price in INR', 'error');
          return;
        }
      }
      if (mode === 'barter' && !barterWantCategory) {
        addToast('Select what item category you want in exchange', 'error');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      if (category === 'textbook' && subject.trim()) {
        formData.append('subject', subject.trim());
      }
      formData.append('description', description.trim());
      formData.append('condition', condition);
      formData.append('mode', mode);

      if (mode === 'sell') {
        // Convert rupees to paise
        const paise = Math.round(Number(priceRupees) * 100);
        formData.append('pricePaise', paise.toString());
      }

      if (mode === 'barter') {
        formData.append('barterWantCategory', barterWantCategory);
        if (barterWantSubject.trim()) {
          formData.append('barterWantSubject', barterWantSubject.trim());
        }
        formData.append('barterWantGrade', barterWantGrade);
      }

      selectedImages.forEach((img) => {
        formData.append('images', img);
      });

      await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast('Listing posted successfully!', 'success');
      navigate('/feed');
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || 'Failed to publish listing', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Post School Supply</h2>
            <p className="text-xs text-slate-500">School-verified listing in under 60 seconds</p>
          </div>
          <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            Step {step} of 5
          </span>
        </div>

        {/* Form Steps */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <Input
                label="Item Listing Title"
                placeholder="NCERT Mathematics textbook Grade 8"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Item Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 touch-target"
                >
                  <option value="textbook">Textbook</option>
                  <option value="uniform_top">Uniform Shirt/Top</option>
                  <option value="uniform_bottom">Uniform Pant/Skirt</option>
                  <option value="shoes">School Shoes</option>
                  <option value="bag">School Bag</option>
                  <option value="stationery">Stationery / Geometry Box</option>
                  <option value="other">Other Supplies</option>
                </select>
              </div>

              {category === 'textbook' && (
                <Input
                  label="Subject Name"
                  placeholder="Mathematics, Science, History..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              )}
            </div>
          )}

          {/* STEP 2: Description & Condition */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Detailed Description</label>
                <textarea
                  placeholder="Mention binding issues, markings, wear details, or sizing rules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Item Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'like_new', label: 'Like New', desc: 'No markings, barely used' },
                    { val: 'good', label: 'Good', desc: 'Light wear, fully readable' },
                    { val: 'fair', label: 'Fair', desc: 'Used, some writing/wear' },
                    { val: 'worn', label: 'Worn', desc: 'Heavy wear, complete' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setCondition(item.val as any)}
                      className={`p-3 text-left border rounded-lg transition-colors flex flex-col gap-0.5
                        ${condition === item.val 
                          ? 'border-primary-600 bg-primary-50/50 ring-1 ring-primary-600' 
                          : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <span className="font-bold text-slate-800 text-sm">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Exchange Mode */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Exchange Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'sell', label: 'Sell (Cash)' },
                    { val: 'barter', label: 'Barter Swap' },
                    { val: 'free', label: 'Donation' },
                  ].map((modeItem) => (
                    <button
                      key={modeItem.val}
                      type="button"
                      onClick={() => setMode(modeItem.val as any)}
                      className={`py-3 text-center border rounded-lg font-bold text-sm transition-colors
                        ${mode === modeItem.val 
                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      {modeItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'sell' && (
                <Input
                  label="Selling Price (₹ INR)"
                  placeholder="250"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value.replace(/[^\d]/g, ''))}
                  type="number"
                  required
                />
              )}

              {mode === 'barter' && (
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col gap-4 animate-fade-in">
                  <h4 className="font-bold text-amber-900 text-sm">Complementary Item You Want</h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Category Wanted</label>
                    <select
                      value={barterWantCategory}
                      onChange={(e) => setBarterWantCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white touch-target"
                    >
                      <option value="textbook">Textbook</option>
                      <option value="uniform_top">Uniform Shirt/Top</option>
                      <option value="uniform_bottom">Uniform Pant/Skirt</option>
                      <option value="shoes">School Shoes</option>
                      <option value="bag">School Bag</option>
                      <option value="stationery">Stationery</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Subject (Optional)"
                      placeholder="Science, Social..."
                      value={barterWantSubject}
                      onChange={(e) => setBarterWantSubject(e.target.value)}
                      className="mb-0"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700">Class Grade</label>
                      <select
                        value={barterWantGrade}
                        onChange={(e) => setBarterWantGrade(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 touch-target"
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Class {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'free' && (
                <div className="p-4 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                  💖 Listings marked as Donation are hosted in our Free Corner. Verified low-income parents and registered NGO coordinators can request to claim these items directly from you for free.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Photo Uploads */}
          {step === 4 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <label className="text-sm font-semibold text-slate-700">Upload Photos (Max 4)</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border">
                    <img src={preview} alt="upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {selectedImages.length < 4 && (
                  <label className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <Camera size={24} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Preview & Publish */}
          {step === 5 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
                <h3 className="font-extrabold text-slate-800 text-base">{title || 'Untitled listing'}</h3>
                
                <div className="flex gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-primary-100 text-primary-800 rounded capitalize">
                    {category}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                    Grade {user?.defaultGrade || 1}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {mode === 'sell' ? `₹ ${priceRupees}` : mode === 'barter' ? 'Barter' : 'Donation'}
                  </span>
                </div>

                {description && (
                  <p className="text-xs text-slate-600 leading-relaxed border-t pt-2 mt-1 italic">
                    "{description}"
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400 text-center">
                By publishing, you agree to exchange this supply at the specified parameters with verified parents.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between border-t pt-5 mt-3">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                <ArrowLeft size={16} className="mr-1.5" /> Back
              </Button>
            ) : (
              <div /> // placeholder for layout
            )}

            {step < 5 ? (
              <Button type="button" onClick={nextStep}>
                Next <ArrowRight size={16} className="ml-1.5" />
              </Button>
            ) : (
              <Button type="submit" variant="secondary" isLoading={isLoading}>
                Publish Exchange Listing
              </Button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
