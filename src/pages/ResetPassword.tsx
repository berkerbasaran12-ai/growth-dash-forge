import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import havanaLogo from "@/assets/havana-logo.png";
import { BackgroundPaths } from "@/components/BackgroundPaths";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast.error("Hata: " + error.message);
    } else {
      toast.success("Şifreniz başarıyla güncellendi.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <BackgroundPaths />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <div className="glass rounded-2xl p-8 space-y-8">
          <div className="text-center">
            <img src={havanaLogo} alt="Havana Dijital" className="h-10 mx-auto" />
          </div>

          {!isRecovery ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Bu sayfa yalnızca şifre sıfırlama bağlantısı ile erişilebilir.
              </p>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Giriş Sayfasına Dön
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sm text-muted-foreground text-center">
                Yeni şifrenizi belirleyin.
              </p>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm text-muted-foreground">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">Şifre Tekrar</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 h-11"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  "Şifreyi Güncelle"
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
