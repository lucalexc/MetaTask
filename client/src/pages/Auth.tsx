import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GlassCard } from "@/components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const authSchema = z.object({
  username: z.string().email("Por favor, insira um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const [_, setLocation] = useLocation();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isLogin) {
        await login.mutateAsync({ username: data.username, password: data.password });
      } else {
        if (!data.name) {
          form.setError("name", { message: "O nome é obrigatório" });
          return;
        }
        await register.mutateAsync({ 
          username: data.username, 
          password: data.password,
          name: data.name 
        });
      }
      setLocation("/");
    } catch (error: any) {
      console.error(error);
      form.setError("root", { 
        message: error.message || "Ocorreu um erro. Tente novamente." 
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FCFAF8]">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] mb-2">
            MetaTask
          </h1>
          <p className="text-[#808080] text-[13px] leading-[18px]">Organize seu fluxo. Domine seu dia.</p>
        </div>

        <GlassCard className="p-8">
          <div className="flex w-full mb-8 bg-gray-100 border border-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-1.5 text-[13px] leading-[18px] font-bold transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#dceaff] rounded-md ${
                isLogin ? "bg-white shadow-sm text-[#202020]" : "text-[#808080] hover:text-[#202020]"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-1.5 text-[13px] leading-[18px] font-bold transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#dceaff] rounded-md ${
                !isLogin ? "bg-white shadow-sm text-[#202020]" : "text-[#808080] hover:text-[#202020]"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="ola@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <div className="text-destructive text-sm font-medium text-center">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full mt-6" 
                size="lg"
                isLoading={login.isPending || register.isPending}
              >
                {isLogin ? "Entrar" : "Criar minha conta"}
              </Button>
            </form>
          </Form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
