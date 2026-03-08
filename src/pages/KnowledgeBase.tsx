import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Play, FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const typeIcon: Record<string, React.ReactNode> = {
  video: <Play className="h-3.5 w-3.5" />,
  pdf: <FileText className="h-3.5 w-3.5" />,
  link: <ExternalLink className="h-3.5 w-3.5" />,
};
const typeLabel: Record<string, string> = { video: "Video", pdf: "PDF", link: "Link" };

const KnowledgeBase = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, contentRes] = await Promise.all([
        supabase.from("kb_categories").select("*").order("sort_order"),
        supabase.from("kb_content").select("*, kb_categories(name, icon)").eq("status", "published").order("sort_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (contentRes.data) setContent(contentRes.data);
    };
    fetchData();
  }, []);

  const filtered = content.filter((c) => {
    const matchCat = activeCategory === "all" || c.category_id === activeCategory;
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

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="İçerik ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-10" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory("all")} className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${activeCategory === "all" ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'}`}>
            📚 Tümü
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${activeCategory === cat.id ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.content_url || "#"}
              target={item.content_type === "link" ? "_blank" : undefined}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-5 space-y-3 cursor-pointer group hover:border-primary/20 transition-all duration-200 block"
            >
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-xs bg-secondary border-border text-muted-foreground">
                  {typeIcon[item.content_type]}<span className="ml-1">{typeLabel[item.content_type]}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">{item.kb_categories?.icon}</span>
              </div>
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
            </motion.a>
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
