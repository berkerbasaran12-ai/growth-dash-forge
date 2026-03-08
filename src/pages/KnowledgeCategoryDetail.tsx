import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, FileText, ExternalLink, File, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const typeIcon: Record<string, React.ReactNode> = {
  video: <Play className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  link: <ExternalLink className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
};
const typeLabel: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  link: "Link",
  file: "Dosya",
};
const typeColor: Record<string, string> = {
  video: "bg-red-500/10 text-red-600 dark:text-red-400",
  pdf: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  link: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  file: "bg-green-500/10 text-green-600 dark:text-green-400",
};

const KnowledgeCategoryDetail = () => {
  const { categoryId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;

      const [catRes, contentRes] = await Promise.all([
        supabase.from("kb_categories").select("*").eq("id", categoryId).single(),
        supabase
          .from("kb_content")
          .select("*")
          .eq("category_id", categoryId)
          .eq("status", "published")
          .order("sort_order"),
      ]);

      if (catRes.data) setCategory(catRes.data);
      if (contentRes.data) setContent(contentRes.data);
    };
    fetchData();
  }, [categoryId]);

  const filtered = content.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/knowledge-base")}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {category?.icon} {category?.name || "Yükleniyor..."}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {content.length} içerik
            </p>
          </div>
        </div>

        {category?.thumbnail_url && (
          <div className="relative rounded-xl overflow-hidden aspect-[3/1]">
            <img
              src={category.thumbnail_url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İçerik ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border h-10"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.content_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  typeColor[item.content_type] || typeColor.file
                }`}
              >
                {typeIcon[item.content_type] || typeIcon.file}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
              <Badge
                variant="secondary"
                className={`text-xs shrink-0 ${
                  typeColor[item.content_type] || typeColor.file
                }`}
              >
                {typeLabel[item.content_type] || "Dosya"}
              </Badge>
            </motion.a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {content.length === 0
                ? "Bu kategoride henüz içerik yok"
                : "Arama sonucu bulunamadı"}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default KnowledgeCategoryDetail;
