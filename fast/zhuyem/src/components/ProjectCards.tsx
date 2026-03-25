import { 
  Building2, 
  Wind, 
  Utensils, 
  Sprout, 
  Plus, 
  MoreHorizontal, 
  ArrowRight 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

// Featured Card
export function FeaturedCard() {
  return (
    <div className="group relative overflow-hidden bg-surface-container-high rounded-xl transition-all duration-300 hover:bg-surface-bright h-full">
      <div className="h-64 overflow-hidden">
        <img 
          src="https://picsum.photos/seed/arch/1200/600" 
          alt="Project Architecture" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-surface-container-high/40 to-transparent"></div>
      </div>
      <div className="absolute bottom-0 left-0 p-8 w-full">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-xs uppercase tracking-widest font-bold text-primary">Core Strategy</span>
        </div>
        <h3 className="text-3xl font-headline font-extrabold text-on-surface mb-3">Project Architecture & PRD</h3>
        <p className="text-on-surface-variant line-clamp-2 max-w-xl mb-6">
          Defining the technical scaffolding and product requirements for the next generation of curated digital experiences.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <img 
                key={i}
                src={`https://picsum.photos/seed/user${i}/100/100`} 
                alt={`User ${i}`} 
                className="w-8 h-8 rounded-full border-2 border-surface-container-high"
                referrerPolicy="no-referrer"
              />
            ))}
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold border-2 border-surface-container-high text-on-primary-container">
              +4
            </div>
          </div>
          <button className="bg-on-surface text-surface rounded-full px-6 py-2 text-sm font-bold active:scale-95 transition-transform">
            Open Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

// Performance Card
export function PerformanceCard() {
  return (
    <div className="bg-surface-container-high rounded-xl p-6 flex flex-col justify-between hover:bg-surface-bright transition-all group h-full">
      <div>
        <div className="w-12 h-12 bg-primary-container/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
          <Wind className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Ski Athlete Performance</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
          Biometric data visualization and run analytics for the Olympic qualifying winter team.
        </p>
      </div>
      <div className="space-y-4">
        <div className="h-1 bg-surface-container-lowest rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '75%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-primary rounded-full" 
          />
        </div>
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
          <span>Analysis Complete</span>
          <span>75%</span>
        </div>
        <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant italic">Updated 2h ago</span>
          <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

// Nutrition Card
export function NutritionCard() {
  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant/10 h-full">
      <div className="h-40 bg-surface-container-lowest flex items-center justify-center relative">
        <img 
          src="https://picsum.photos/seed/food/600/400" 
          alt="Nutrition Dashboard" 
          className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-surface-container-low/20"></div>
        <div className="absolute top-4 right-4 bg-surface-container-highest/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-primary">Live</div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Nutrition Dashboard Home</h3>
        <p className="text-on-surface-variant text-sm mb-4">Daily intake tracking and macro-nutrient optimization interface.</p>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] text-on-surface-variant">V3.0</span>
          <span className="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] text-on-surface-variant">Health-Tech</span>
        </div>
      </div>
    </div>
  );
}

// Plant Care Card
export function PlantCareCard() {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant/10 h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center">
          <Sprout className="w-5 h-5 text-on-surface" />
        </div>
        <MoreHorizontal className="w-5 h-5 text-on-surface-variant cursor-pointer hover:text-primary" />
      </div>
      <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Indoor Plant Care</h3>
      <p className="text-on-surface-variant text-sm mb-6">Automated IoT monitoring for residential botanical collections.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Moisture</p>
          <p className="text-primary font-bold">42%</p>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Lux</p>
          <p className="text-primary font-bold">1.2k</p>
        </div>
      </div>
    </div>
  );
}

// Create New Card
export function CreateNewCard() {
  return (
    <div className="border-2 border-dashed border-outline-variant/20 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-surface-container-low hover:border-primary/20 transition-all group h-full">
      <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Plus className="w-6 h-6 text-on-surface-variant" />
      </div>
      <p className="font-bold text-sm text-on-surface-variant group-hover:text-primary">Create New Project</p>
      <p className="text-[10px] text-on-surface-variant/60 mt-1">Start from a blank canvas</p>
    </div>
  );
}
