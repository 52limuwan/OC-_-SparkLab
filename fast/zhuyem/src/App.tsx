import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { 
  FeaturedCard, 
  PerformanceCard, 
  NutritionCard, 
  PlantCareCard, 
  CreateNewCard 
} from './components/ProjectCards';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopNav />
        
        <section className="mt-16 p-8 flex-1">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2"
              >
                Curator Dashboard
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-on-surface-variant text-lg max-w-2xl"
              >
                Organize your creative vision through editorial clarity. Your active workspace for high-performance projects.
              </motion.p>
            </div>
            
            <div className="flex gap-2">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-sm text-xs font-medium">
                Filter: All
              </span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-sm text-xs font-medium">
                Sort: Recent
              </span>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-8"
            >
              <FeaturedCard />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-4"
            >
              <PerformanceCard />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-4"
            >
              <NutritionCard />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-4"
            >
              <PlantCareCard />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-4"
            >
              <CreateNewCard />
            </motion.div>
          </div>
        </section>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8">
          <button className="bg-primary hover:bg-primary-dim text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:rotate-90 active:scale-90 group">
            <Plus className="w-6 h-6 font-bold group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
}
