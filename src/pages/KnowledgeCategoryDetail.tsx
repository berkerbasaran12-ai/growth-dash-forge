import { useState, useEffect } from "react";
import { ArrowLeft, Play, FileText, ExternalLink, File, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const typeLabel: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  link: "Link",
  file: "Dosya",
};

const KnowledgeCategoryDetail = () => {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

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
      if (contentRes.data) {
        setContent(contentRes.data);
        // Don't auto-select
      }
    };
    fetchData();
  }, [categoryId]);

  const selectedItem = content.find((c) => c.id === selectedId);
  const progressPercent = content.length > 0 ? Math.round((completedIds.size / content.length) * 100) : 0;

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="-m-3 sm:-m-6 flex flex-row min-h-[calc(100vh-3.5rem)]">
        {/* Left sidebar - content list */}
        <div className="w-[320px] md:w-[380px] shrink-0 border-r border-border bg-card overflow-y-auto h-[calc(100vh-3.5rem)]">
          <div className="p-5 border-b border-border space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/knowledge-base")}
              className="text-xs text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Eğitimlere Dön
            </Button>
            <h2 className="font-bold text-foreground text-base leading-tight">
              {category?.name || "Yükleniyor..."}
            </h2>
            <div className="space-y-1.5">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">{progressPercent}%</p>
            </div>
          </div>

          <div className="py-1">
            {content.map((item) => {
              const isSelected = selectedId === item.id;
              const isCompleted = completedIds.has(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors text-sm border-l-2 ${
                    isSelected
                      ? "bg-primary/10 border-l-primary font-medium text-foreground"
                      : "border-l-transparent text-foreground hover:bg-accent/50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <span className="flex-1 truncate">{item.title}</span>
                </button>
              );
            })}

            {content.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Bu kategoride henüz içerik yok
              </div>
            )}
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 bg-background overflow-y-auto h-[calc(100vh-3.5rem)]">
          {selectedItem ? (
            <div className="p-6 lg:p-10 max-w-3xl space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-foreground">{selectedItem.title}</h2>
                <button
                  onClick={() => toggleComplete(selectedItem.id)}
                  className={`shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                    completedIds.has(selectedItem.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent hover:border-muted-foreground"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>

              {selectedItem.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </p>
              )}

              {selectedItem.content_url && selectedItem.content_type === "video" && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={selectedItem.content_url.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {selectedItem.content_url && selectedItem.content_type === "pdf" && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <iframe src={selectedItem.content_url} className="w-full h-[600px]" />
                </div>
              )}

              {selectedItem.content_url && (selectedItem.content_type === "link" || selectedItem.content_type === "file") && (
                <a
                  href={selectedItem.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {selectedItem.content_url}
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Bir içerik seçin
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default KnowledgeCategoryDetail;
