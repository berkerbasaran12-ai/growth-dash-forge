import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronRight, Grid2X2, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type ViewMode = "grid4" | "grid3" | "list";

const KnowledgeBase = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("grid4");

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase
        .from("kb_categories")
        .select("*")
        .order("sort_order");

      if (cats) setCategories(cats);

      // Get content counts per category
      const { data: contentData } = await supabase
        .from("kb_content")
        .select("category_id, status")
        .eq("status", "published");

      if (contentData) {
        const counts: Record<string, number> = {};
        contentData.forEach((c: any) => {
          if (c.category_id) {
            counts[c.category_id] = (counts[c.category_id] || 0) + 1;
          }
        });
        setContentCounts(counts);
      }

      // Filter categories by access for non-admin users
      if (user && !isAdmin) {
        const { data: accessData } = await supabase
          .from("kb_category_access")
          .select("category_id")
          .eq("user_id", user.id);

        const allowedIds = new Set(accessData?.map((a: any) => a.category_id) || []);
        if (cats) {
          setCategories(cats.filter((c: any) => allowedIds.has(c.id)));
        }
      }
    };
    fetchData();
  }, [user, isAdmin]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const gridClass =
    viewMode === "grid4"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      : viewMode === "grid3"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      : "flex flex-col gap-3";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Eğitimler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              İş geliştirme ve satış eğitimlerimizle kendinizi geliştirin
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "grid3" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid3")}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid4" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid4")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Eğitim ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border h-10"
          />
        </div>

        <div className={gridClass}>
          {filtered.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {viewMode === "list" ? (
                <button
                  onClick={() => navigate(`/knowledge-base/${cat.id}`)}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group"
                >
                  {cat.thumbnail_url ? (
                    <img
                      src={cat.thumbnail_url}
                      alt={cat.name}
                      className="w-20 h-14 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-2xl">{cat.icon || "📚"}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {contentCounts[cat.id] || 0} içerik
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                    Yayında
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/knowledge-base/${cat.id}`)}
                  className="w-full bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {cat.thumbnail_url ? (
                      <img
                        src={cat.thumbnail_url}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <span className="text-4xl">{cat.icon || "📚"}</span>
                      </div>
                    )}
                    {/* Overlay for title on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-sm leading-tight drop-shadow-lg">
                        {cat.name}
                      </h3>
                    </div>
                    <Badge className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                      Yayında
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {cat.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {contentCounts[cat.id] || 0} içerik
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-full group-hover:bg-primary/90 transition-colors">
                        Kursa Başla <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Eğitim bulunamadı</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default KnowledgeBase;
