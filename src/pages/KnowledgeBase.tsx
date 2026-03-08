import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Play, FileText, ExternalLink, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";

const categories = [
  { id: "all", label: "Tümü", icon: "📚" },
  { id: "dashboard", label: "Dashboard Kullanımı", icon: "📊" },
  { id: "sales", label: "Satış Stratejileri", icon: "💰" },
  { id: "analytics", label: "Veri Analizi", icon: "📈" },
  { id: "marketing", label: "Pazarlama İpuçları", icon: "🎯" },
  { id: "settings", label: "Sistem Ayarları", icon: "⚙️" },
];

const mockContent = [
  { id: 1, title: "Dashboard'a Nasıl Veri Girilir?", description: "Satış metriklerinizi adım adım nasıl gireceğinizi öğrenin.", category: "dashboard", type: "video", status: "published" },
  { id: 2, title: "Satış Raporlarını Anlama", description: "Grafikleri ve tabloları nasıl yorumlayacağınızı keşfedin.", category: "analytics", type: "pdf", status: "published" },
  { id: 3, title: "E-Ticaret Satış Stratejileri 2024", description: "En güncel e-ticaret trendleri ve satış artırma teknikleri.", category: "sales", type: "video", status: "published" },
  { id: 4, title: "Google Ads Optimizasyonu", description: "Reklam bütçenizi en verimli şekilde nasıl kullanacağınızı öğrenin.", category: "marketing", type: "link", status: "published" },
  { id: 5, title: "Hesap Ayarlarını Yönetme", description: "Profil bilgilerinizi ve tercihlerinizi nasıl güncelleyeceğinizi öğrenin.", category: "settings", type: "pdf", status: "published" },
  { id: 6, title: "Müşteri Segmentasyonu", description: "Müşterilerinizi segmentlere ayırarak hedefli pazarlama yapın.", category: "marketing", type: "video", status: "published" },
];

const typeIcon = {
  video: <Play className="h-3.5 w-3.5" />,
  pdf: <FileText className="h-3.5 w-3.5" />,
  link: <ExternalLink className="h-3.5 w-3.5" />,
};

const typeLabel = { video: "Video", pdf: "PDF", link: "Link" };

const KnowledgeBase = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = mockContent.filter((c) => {
    const matchCat = activeCategory === "all" || c.category === activeCategory;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Bilgi Bankası</h1>
          <p className="text-sm text-muted-foreground mt-1">Eğitim içeriklerine göz atın</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İçerik ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border h-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-5 space-y-3 cursor-pointer group hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-xs bg-secondary border-border text-muted-foreground">
                  {typeIcon[item.type as keyof typeof typeIcon]}
                  <span className="ml-1">{typeLabel[item.type as keyof typeof typeLabel]}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {categories.find(c => c.id === item.category)?.icon}
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">İçerik bulunamadı</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default KnowledgeBase;
