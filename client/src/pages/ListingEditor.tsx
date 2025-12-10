import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Upload, Plus, Minus, Wifi, Car, Tv, ChefHat, Wind,
  Star, Heart, Image as ImageIcon, X, Trophy
} from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

// We store the File for the backend, and the preview string for the frontend
interface PhotoItem {
  id: string;      // Unique ID for React keys and drag tracking
  file?: File;     // The raw file to send to backend
  preview: string; // The blob URL to show in the <img> tag
}

interface ListingData {
  title: string;
  description: string;
  price: number;
  location: string;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  photos: PhotoItem[];
}

const AMENITIES = [
  { id: 'wifi', label: 'Fast Wi-Fi', icon: <Wifi size={20} /> },
  { id: 'kitchen', label: 'Chef\'s Kitchen', icon: <ChefHat size={20} /> },
  { id: 'parking', label: 'Free Parking', icon: <Car size={20} /> },
  { id: 'tv', label: '4K TV', icon: <Tv size={20} /> },
  { id: 'ac', label: 'Climate Control', icon: <Wind size={20} /> },
];

interface ListingEditorProps {
  onBack: () => void;
  onSave: (data: ListingData) => void;
}

export const ListingEditor: React.FC<ListingEditorProps> = ({ onBack, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<ListingData>({
    title: '',
    description: '',
    price: 0,
    location: '',
    guests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: [],
    photos: [] 
  });

  useEffect(() => {
    return () => {
      formData.photos.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const handleChange = (field: keyof ListingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id) 
        : [...prev.amenities, id]
    }));
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: PhotoItem[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        preview: URL.createObjectURL(file)
      }));

      setFormData(prev => ({ 
        ...prev, 
        photos: [...prev.photos, ...newPhotos] 
      }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (indexToRemove: number) => {
    setFormData(prev => {
      URL.revokeObjectURL(prev.photos[indexToRemove].preview);
      return {
        ...prev,
        photos: prev.photos.filter((_, index) => index !== indexToRemove)
      };
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newPhotos = [...formData.photos];
    const draggedItem = newPhotos[draggedItemIndex];
    
    newPhotos.splice(draggedItemIndex, 1);
    newPhotos.splice(index, 0, draggedItem);

    setFormData(prev => ({ ...prev, photos: newPhotos }));
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="!p-2 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg hidden md:block">Create Listing</h1>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={() => onSave(formData)}
            className="shadow-lg shadow-amber-500/20"
          >
            Publish Listing
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 lg:p-12">
        
        {/* --- LEFT COLUMN: Editor Form --- */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Section: Basic Info */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold border-b border-gray-100 pb-4">The Basics</h3>
            
            <Input 
              label="Property Title"
              value={formData.title} 
              onChange={e => handleChange('title', e.target.value)} 
              placeholder="e.g. Modern Loft in Downtown"
              maxLength={50}
            />
            
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea 
                value={formData.description} 
                onChange={e => handleChange('description', e.target.value)} 
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none min-h-[160px]"
                placeholder="Share what makes your place special..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input 
                 label="Price (per night)"
                 type="number"
                 value={formData.price || ''}
                 onChange={e => handleChange('price', parseInt(e.target.value))}
                 placeholder="0"
              />
              <Input 
                 label="Location"
                 value={formData.location}
                 onChange={e => handleChange('location', e.target.value)}
                 placeholder="District, City"
              />
            </div>
          </section>

          {/* Section: Photos */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
               <h3 className="text-xl font-bold">Photos</h3>
            </div>
            
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(100px,auto)]">
               
               {/* Empty State: Big Uploader */}
               {formData.photos.length === 0 && (
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="col-span-2 row-span-2 aspect-square md:aspect-[4/3] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer group bg-gray-50"
                 >
                    <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-sm">Upload Photos</span>
                 </div>
               )}

               {/* Photo Grid */}
               {formData.photos.map((photo, index) => (
                 <div 
                    key={photo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      relative group rounded-xl overflow-hidden cursor-move transition-transform duration-200 select-none
                      ${index === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'col-span-1 aspect-square'}
                      ${draggedItemIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
                      shadow-sm hover:shadow-md
                    `}
                 >
                    <img 
                      src={photo.preview} 
                      alt="Listing" 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Delete Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                      className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 shadow-sm z-10"
                    >
                      <X size={16} />
                    </button>

                    {/* Cover Photo Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 text-gray-900 pointer-events-none">
                        <Trophy size={12} className="text-amber-500 fill-amber-500" />
                        Cover Photo
                      </div>
                    )}
                 </div>
               ))}

               {/* "Add More" Tile (Only shows if there are photos) */}
               {formData.photos.length > 0 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="col-span-1 aspect-square border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <Plus size={24} />
                  </div>
               )}
            </div>
          </section>

          {/* Section: Amenities */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold border-b border-gray-100 pb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AMENITIES.map((item) => {
                const isSelected = formData.amenities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleAmenity(item.id)}
                    className={`
                      flex flex-col items-start p-5 rounded-xl border-2 transition-all duration-200
                      ${isSelected 
                        ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm' 
                        : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    <div className={`mb-3 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section: Details (Counters) */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold border-b border-gray-100 pb-4">Details</h3>
            {['Guests', 'Bedrooms', 'Beds', 'Baths'].map((label) => {
               const field = label.toLowerCase() as keyof ListingData;
               const value = formData[field] as number;
               return (
                <div key={label} className="flex items-center justify-between py-2">
                  <span className="font-medium text-lg text-gray-700">{label}</span>
                  <div className="flex items-center gap-4 bg-gray-50 rounded-full p-1 border border-gray-100">
                    <button 
                      onClick={() => handleChange(field, Math.max(0, value - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:text-amber-600 disabled:opacity-50 transition-all"
                      disabled={value <= 0}
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="w-6 text-center font-bold text-gray-900">{value}</span>
                    <button 
                      onClick={() => handleChange(field, value + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:text-amber-600 transition-all"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
               )
            })}
          </section>
        </div>

        {/* --- RIGHT COLUMN: Sticky Preview --- */}
        <div className="hidden lg:block lg:col-span-5">
           <div className="sticky top-32">
              <div className="mb-4">
                 <h2 className="font-bold text-xl text-gray-900">Live Preview</h2>
                 <p className="text-gray-500 text-sm">This is how guests will see your listing.</p>
              </div>
              
              {/* THE CARD */}
              <div className="group block w-full max-w-sm mx-auto bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                 
                 {/* Image Area */}
                 <div className="relative aspect-[1/1.05] bg-gray-200">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm uppercase tracking-wide text-gray-800">
                       Guest Favorite
                    </div>
                    <button className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/50 transition-colors text-white">
                       <Heart className="w-6 h-6 fill-black/20" />
                    </button>
                    
                    {formData.photos.length > 0 ? (
                      <img 
                        src={formData.photos[0].preview} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                 </div>

                 {/* Content Area */}
                 <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-1">
                          {formData.title || 'Your Listing Title'}
                       </h3>
                       <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-black text-sm font-medium">New</span>
                       </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-1">{formData.location || 'Location'}</p>
                    <p className="text-gray-500 text-sm mb-4">
                       {formData.beds} beds · {formData.amenities.length > 0 ? 'Rich Amenities' : 'No amenities selected'}
                    </p>
                    
                    <div className="flex items-baseline gap-1 mt-2">
                       <span className="font-bold text-lg text-gray-900">₺{formData.price || 0}</span>
                       <span className="text-gray-500 text-sm"> night</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>

      </main>
    </div>
  );
};