import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useAuth } from "@/app/context/AuthContext";

interface AuthFormsProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function AuthForms({
  title = "Личный кабинет",
  description = "Просматривать товары можно без входа, но оформление заказа и личный кабинет доступны только зарегистрированным покупателям.",
  compact = false
}: AuthFormsProps) {
  const { login, register } = useAuth();
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", name: "", email: "", phone: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError("");
    try {
      await login(loginForm.login, loginForm.password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError("");
    try {
      await register(registerForm);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не удалось зарегистрироваться.");
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <div className={compact ? "mb-6" : "mb-8"}>
        <h1 className="text-4xl md:text-5xl mb-4 text-white">{title}</h1>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-slate-300">
          <p>{description}</p>
          <p className="mt-2 text-sm text-slate-400">
            Без регистрации посетитель может смотреть каталог и информацию о товарах, но не может оформить заказ и не получает личный кабинет с историей покупок.
          </p>
        </div>
      </div>

      {formError && (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100 whitespace-pre-wrap">
          <p className="font-medium text-red-50 mb-1">Не удалось выполнить действие</p>
          <p>{formError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Вход</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                <Label htmlFor="login" className="text-slate-300">Логин или email</Label>
                <Input id="login" value={loginForm.login} onChange={(event) => setLoginForm({ ...loginForm, login: event.target.value })} className="bg-slate-900 border-slate-700 text-white" required />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-300">Пароль</Label>
                <Input id="password" type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="bg-slate-900 border-slate-700 text-white" required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>Войти</Button>
              <div className="rounded-lg bg-slate-900 p-4 text-sm text-slate-400">
                <p className="text-slate-300 mb-2">Служебные аккаунты для отдельных версий сайта:</p>
                <p>Продавец: <span className="text-emerald-400">prodavec / prodavec</span></p>
                <p>Администратор: <span className="text-emerald-400">admin / admin</span></p>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Регистрация покупателя</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitRegister} className="space-y-4">
              <div>
                <Label htmlFor="regUsername" className="text-slate-300">Логин</Label>
                <Input id="regUsername" value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} className="bg-slate-900 border-slate-700 text-white" required />
              </div>
              <div>
                <Label htmlFor="regName" className="text-slate-300">Имя</Label>
                <Input id="regName" value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} className="bg-slate-900 border-slate-700 text-white" required />
              </div>
              <div>
                <Label htmlFor="regEmail" className="text-slate-300">Email</Label>
                <Input id="regEmail" type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} className="bg-slate-900 border-slate-700 text-white" required />
              </div>
              <div>
                <Label htmlFor="regPhone" className="text-slate-300">Телефон</Label>
                <Input id="regPhone" value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label htmlFor="regPassword" className="text-slate-300">Пароль</Label>
                <Input id="regPassword" type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} className="bg-slate-900 border-slate-700 text-white" required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>Зарегистрироваться</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {content}
      </div>
    </div>
  );
}
