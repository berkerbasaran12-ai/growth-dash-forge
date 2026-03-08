import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, Unplug, Loader2 } from "lucide-react";

const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
    <path d="M3.27 13.56L9.35 3.06C9.74 2.38 10.62 2.14 11.3 2.53L13.3 3.68C13.98 4.07 14.22 4.95 13.83 5.63L7.75 16.13C7.36 16.81 6.48 17.05 5.8 16.66L3.8 15.51C3.12 15.12 2.88 14.24 3.27 13.56Z" fill="#FBBC04"/>
    <path d="M14.73 13.56L20.81 3.06C21.2 2.38 20.96 1.5 20.28 1.11L18.28 -0.04C17.6 -0.43 16.72 -0.19 16.33 0.49L10.25 10.99C9.86 11.67 10.1 12.55 10.78 12.94L12.78 14.09C13.46 14.48 14.34 14.24 14.73 13.56Z" fill="#4285F4"/>
    <circle cx="6" cy="19" r="3.5" fill="#34A853"/>
  </svg>
);

const MetaAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="#1877F2"/>
    <path d="M16.5 8.5C16.5 8.5 15.5 7 13.5 7C11.5 7 10 8.5 10 10.5V12H8V14.5H10V22H13V14.5H15.5L16 12H13V10.5C13 9.5 13.5 9 14.5 9H16.5V8.5Z" fill="white"/>
  </svg>
);

const Integrations = () => {
  const { effectiveUserId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check connection status on mount
  useEffect(() => {
    if (!effectiveUserId) return;
    const checkConnections = async () => {
      const { data } = await supabase
        .from("ad_platform_connections")
        .select("platform, is_active")
        .eq("user_id", effectiveUserId);
      if (data) {
        setGoogleConnected(data.some(c => c.platform === "google_ads" && c.is_active));
        setMetaConnected(data.some(c => c.platform === "meta_ads" && c.is_active));
      }
      setCheckingStatus(false);
    };
    checkConnections();
  }, [effectiveUserId]);

  // Handle OAuth redirect results
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "google_ads") {
      toast.success("Google Ads başarıyla bağlandı!");
      setGoogleConnected(true);
      setSearchParams({});
    }
    if (success === "meta_ads") {
      toast.success("Meta Ads başarıyla bağlandı!");
      setMetaConnected(true);
      setSearchParams({});
    }
    if (error) {
      toast.error("Bağlantı başarısız: " + error);
      setSearchParams({});
    }
  }, [searchParams]);

  const handleConnectGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-ads-auth", {
        body: { user_id: effectiveUserId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Google Ads bağlantısı başlatılamadı: " + err.message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleConnectMeta = async () => {
    setLoadingMeta(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-ads-auth", {
        body: { user_id: effectiveUserId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Meta Ads bağlantısı başlatılamadı: " + err.message);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleDisconnectMeta = async () => {
    try {
      const { error } = await supabase
        .from("ad_platform_connections")
        .update({ is_active: false })
        .eq("user_id", effectiveUserId)
        .eq("platform", "meta_ads");
      if (error) throw error;
      setMetaConnected(false);
      toast.success("Meta Ads bağlantısı kaldırıldı");
    } catch (err: any) {
      toast.error("Bağlantı kaldırılamadı: " + err.message);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const { error } = await supabase
        .from("ad_platform_connections")
        .update({ is_active: false })
        .eq("user_id", effectiveUserId)
        .eq("platform", "google_ads");
      if (error) throw error;
      setGoogleConnected(false);
      toast.success("Google Ads bağlantısı kaldırıldı");
    } catch (err: any) {
      toast.error("Bağlantı kaldırılamadı: " + err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Entegrasyonlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reklam platformlarını bağlayarak verilerinizi otomatik olarak çekin
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Google Ads Card */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <GoogleAdsIcon />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Google Ads</CardTitle>
                  {googleConnected ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Bağlı</Badge>
                  ) : (
                    <Badge variant="secondary">Bağlı Değil</Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  Google Ads hesabınızı bağlayarak kampanya verilerinizi otomatik olarak dashboard'a aktarın.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {googleConnected ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDisconnectGoogle} className="gap-1.5">
                    <Unplug className="h-3.5 w-3.5" /> Bağlantıyı Kes
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={handleConnectGoogle} disabled={loadingGoogle} className="gap-1.5">
                  {loadingGoogle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                  Google Ads Bağla
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Meta Ads Card */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <MetaAdsIcon />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Meta Ads</CardTitle>
                  {metaConnected ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Bağlı</Badge>
                  ) : (
                    <Badge variant="secondary">Bağlı Değil</Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  Facebook & Instagram Ads hesabınızı bağlayarak reklam performansınızı takip edin.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {metaConnected ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDisconnectMeta} className="gap-1.5">
                    <Unplug className="h-3.5 w-3.5" /> Bağlantıyı Kes
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={handleConnectMeta} disabled={loadingMeta} className="gap-1.5">
                  {loadingMeta ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                  Meta Ads Bağla
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Nasıl çalışır?</strong> Reklam platformunuzu bağladığınızda, kampanya verileri (harcama, tıklama, dönüşüm vb.) otomatik olarak dashboard'unuza aktarılır. Veriler günlük olarak güncellenir.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integrations;
