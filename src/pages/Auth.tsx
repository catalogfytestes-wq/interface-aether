import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user, loading, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        setErrors({ email: emailResult.error.errors[0].message });
        return;
      }
      
      setIsLoading(true);
      try {
        const { error } = await requestPasswordReset(email);
        if (error) {
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Email enviado!',
            description: 'Verifique sua caixa de entrada para redefinir sua senha'
          });
          setIsForgotPassword(false);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Erro de autenticação',
              description: 'Email ou senha incorretos',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Erro',
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: 'Bem-vindo!',
            description: 'Login realizado com sucesso'
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Usuário já existe',
              description: 'Este email já está cadastrado. Tente fazer login.',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Erro',
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Verifique seu email para confirmar o cadastro'
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="hud-glass rounded-lg p-8 holo-border">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30"
            >
              <User className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary text-glow tracking-wider">
              {isForgotPassword ? 'RECUPERAR SENHA' : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
            </h1>
            <p className="text-muted-foreground text-sm mt-2 terminal-text">
              {isForgotPassword 
                ? 'Digite seu email para receber o link' 
                : isLogin 
                  ? 'Acesse sua conta JARVIS' 
                  : 'Registre-se no sistema'}
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Nome de exibição
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-background/50 border border-primary/30 rounded px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors terminal-text"
                    placeholder="Como deseja ser chamado"
                  />
                </div>
              </motion.div>
            )}
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full bg-background/50 border ${errors.email ? 'border-destructive' : 'border-primary/30'} rounded px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors terminal-text`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs mt-1 terminal-text">{errors.email}</p>
              )}
            </div>
            
            {!isForgotPassword && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: undefined });
                    }}
                    className={`w-full bg-background/50 border ${errors.password ? 'border-destructive' : 'border-primary/30'} rounded px-4 py-3 pl-11 pr-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors terminal-text`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1 terminal-text">{errors.password}</p>
                )}
                
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrors({});
                    }}
                    className="text-xs text-primary/70 hover:text-primary mt-2 terminal-text"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </div>
            )}
            
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full hud-button py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? 'ENVIAR LINK' : isLogin ? 'ENTRAR' : 'CADASTRAR'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
          
          {/* Toggle */}
          <div className="mt-6 text-center space-y-2">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors terminal-text"
              >
                <span className="text-primary underline">Voltar para login</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors terminal-text"
              >
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                <span className="text-primary underline">
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
