import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Calendar, CreditCard, Settings, LogOut, 
  ArrowLeft, Edit2, Save, Loader2, Shield, Zap, Camera, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, subscription, subscriptionStatus, signOut, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      setIsEditing(false);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 2MB.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL (add timestamp to bust cache)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({
        title: 'Avatar atualizado',
        description: 'Sua foto de perfil foi alterada com sucesso.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar avatar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível abrir o portal de pagamentos.',
        variant: 'destructive'
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return 'Nenhum';
    switch (planId) {
      case 'starter': return 'Starter';
      case 'pro': return 'Pro';
      case 'business': return 'Business';
      case 'enterprise': return 'Enterprise';
      default: return planId;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'canceled': return 'Cancelado';
      case 'past_due': return 'Pagamento pendente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasActiveSubscription = subscriptionStatus?.subscribed || false;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="hud-button p-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary text-glow tracking-wider">
              MEU PERFIL
            </h1>
            <p className="text-muted-foreground terminal-text">
              Gerencie suas informações
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hud-glass rounded-lg p-6 holo-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground tracking-wider flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                INFORMAÇÕES
              </h2>
              <button
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                disabled={isSaving}
                className="hud-button p-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Edit2 className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Avatar Section */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 bg-background/50">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Nome de exibição
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-background/50 border border-primary/30 rounded px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors terminal-text"
                  />
                ) : (
                  <p className="text-foreground terminal-text">
                    {profile?.display_name || 'Não definido'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-foreground terminal-text">{user?.email}</p>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Membro desde
                </label>
                <p className="text-foreground terminal-text">
                  {profile?.created_at 
                    ? format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : '-'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Subscription Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hud-glass rounded-lg p-6 holo-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground tracking-wider flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                ASSINATURA
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                  hasActiveSubscription 
                    ? 'bg-primary/20 border-primary' 
                    : 'bg-muted/20 border-muted-foreground/30'
                }`}>
                  <Zap className={`w-6 h-6 ${
                    hasActiveSubscription ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Plano {getPlanName(subscriptionStatus?.plan_name || subscription?.plan_id)}
                  </p>
                  <p className="text-sm text-muted-foreground terminal-text flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Status: {getStatusLabel(subscription?.status || 'inactive')}
                  </p>
                </div>
              </div>
              
              {subscriptionStatus?.subscription_end && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Válido até
                  </label>
                  <p className="text-foreground terminal-text">
                    {format(new Date(subscriptionStatus.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              
              <div className="space-y-3 mt-4">
                {hasActiveSubscription && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenCustomerPortal}
                    disabled={isOpeningPortal}
                    className="w-full hud-button py-3 flex items-center justify-center gap-2"
                  >
                    {isOpeningPortal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        GERENCIAR ASSINATURA
                      </>
                    )}
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/plans')}
                  className="w-full hud-button py-3"
                >
                  {hasActiveSubscription ? 'VER PLANOS' : 'ESCOLHER PLANO'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hud-glass rounded-lg p-6 holo-border md:col-span-2"
          >
            <h2 className="text-lg font-semibold text-foreground tracking-wider flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-primary" />
              AÇÕES
            </h2>
            
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="hud-button py-3 px-6 flex items-center gap-2 border-destructive/30 hover:border-destructive text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                SAIR DA CONTA
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
