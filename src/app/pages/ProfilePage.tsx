import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Shield, User, Package, Settings, Store, Activity } from "lucide-react";
import { AdminAction, apiRequest, formatPrice, Order, User as ApiUser } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

const orderStatuses = ["new", "paid", "processing", "shipped", "delivered", "cancelled"];

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Новый",
    paid: "Оплачен",
    processing: "В обработке",
    shipped: "В пути",
    delivered: "Доставлен",
    cancelled: "Отменен",
    pending: "Ожидает"
  };
  return labels[status] || status;
}

function AuthForms() {
  const { login, register } = useAuth();
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", name: "", email: "", phone: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await login(loginForm.login, loginForm.password);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await register(registerForm);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось зарегистрироваться.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl md:text-5xl mb-4 text-white">Личный кабинет</h1>
        <p className="text-slate-400 mb-8">Просматривать товары можно без входа, но оформление заказа доступно только зарегистрированным покупателям.</p>

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
                  <p className="text-slate-300 mb-2">Служебные аккаунты:</p>
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
      </div>
    </div>
  );
}

function OrdersList({ isSeller = false }: { isSeller?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    const data = await apiRequest<{ orders: Order[] }>("/orders.php");
    setOrders(data.orders);
  };

  useEffect(() => {
    loadOrders().catch((error) => alert(error instanceof Error ? error.message : "Не удалось загрузить заказы."));
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    const data = await apiRequest<{ orders: Order[] }>("/orders.php", {
      method: "POST",
      body: JSON.stringify({ action: "status", order_id: orderId, status })
    });
    setOrders(data.orders);
  };

  if (orders.length === 0) {
    return <Card className="bg-slate-800 border-slate-700"><CardContent className="p-8 text-slate-400">Заказов пока нет.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h3 className="text-xl text-white mb-2">Заказ #{order.order_number}</h3>
                {isSeller && <p className="text-slate-400">Клиент: {order.customer_name} · {order.customer_email}</p>}
                <p className="text-slate-400">Дата: {new Date(order.created_at).toLocaleString("ru-RU")}</p>
                <p className="text-slate-400">Товаров: {order.items_count}</p>
                <p className="text-slate-400">Адрес: {order.delivery_address || "не указан"}</p>
              </div>
              <div className="text-right space-y-3">
                <p className="text-2xl text-emerald-400">{formatPrice(order.total_kzt)}</p>
                <span className="inline-flex px-3 py-1 rounded-full text-sm bg-emerald-950 text-emerald-400">{statusLabel(order.status)}</span>
                {isSeller && (
                  <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="block w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white">
                    {orderStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                  </select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CustomerProfile({ user }: { user: ApiUser }) {
  const { updateProfile, logout } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || "" });

  const saveProfile = async () => {
    try {
      await updateProfile(form);
      alert("Профиль сохранен.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось сохранить профиль.");
    }
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600"><User className="h-4 w-4 mr-2" />Профиль</TabsTrigger>
        <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600"><Package className="h-4 w-4 mr-2" />Мои заказы</TabsTrigger>
        <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600"><Settings className="h-4 w-4 mr-2" />Настройки</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Личная информация</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-slate-300">Логин</Label><Input value={user.username} disabled className="bg-slate-900 border-slate-700 text-slate-400" /></div>
            <div><Label className="text-slate-300">Имя</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="bg-slate-900 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="bg-slate-900 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Телефон</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="bg-slate-900 border-slate-700 text-white" /></div>
            <Button onClick={saveProfile} className="bg-emerald-600 hover:bg-emerald-700">Сохранить изменения</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders" className="mt-6"><OrdersList /></TabsContent>
      <TabsContent value="settings" className="mt-6"><Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><Button variant="destructive" onClick={logout} className="w-full">Выйти из аккаунта</Button></CardContent></Card></TabsContent>
    </Tabs>
  );
}

function SellerProfile() {
  const { logout } = useAuth();
  return (
    <Tabs defaultValue="orders" className="w-full">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600"><Store className="h-4 w-4 mr-2" />Все заказы</TabsTrigger>
        <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600"><Settings className="h-4 w-4 mr-2" />Настройки</TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="mt-6"><OrdersList isSeller /></TabsContent>
      <TabsContent value="settings" className="mt-6"><Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><Button variant="destructive" onClick={logout} className="w-full">Выйти из профиля продавца</Button></CardContent></Card></TabsContent>
    </Tabs>
  );
}

function AdminProfile() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);

  const loadAdminData = async () => {
    const data = await apiRequest<{ users: ApiUser[]; actions: AdminAction[] }>("/admin.php");
    setUsers(data.users);
    setActions(data.actions);
  };

  useEffect(() => {
    loadAdminData().catch((error) => alert(error instanceof Error ? error.message : "Не удалось загрузить админ-данные."));
  }, []);

  const setUserStatus = async (userId: number, status: "active" | "blocked") => {
    await apiRequest("/admin.php", {
      method: "POST",
      body: JSON.stringify({ action: "set_user_status", user_id: userId, status })
    });
    await loadAdminData();
  };

  return (
    <Tabs defaultValue="actions" className="w-full">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger value="actions" className="data-[state=active]:bg-emerald-600"><Activity className="h-4 w-4 mr-2" />Действия</TabsTrigger>
        <TabsTrigger value="users" className="data-[state=active]:bg-emerald-600"><Shield className="h-4 w-4 mr-2" />Пользователи</TabsTrigger>
        <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600"><Settings className="h-4 w-4 mr-2" />Настройки</TabsTrigger>
      </TabsList>

      <TabsContent value="actions" className="mt-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Все действия пользователей</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-white">{action.action}</p>
                  <p className="text-slate-500 text-sm">{new Date(action.created_at).toLocaleString("ru-RU")}</p>
                </div>
                <p className="text-slate-400 text-sm">Пользователь: {action.username || "гость"} {action.role ? `· ${action.role}` : ""}</p>
                {action.details && <Textarea value={action.details} readOnly className="mt-2 bg-slate-950 border-slate-700 text-slate-300" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Администрирование пользователей</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {users.map((account) => (
              <div key={account.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
                <div>
                  <p className="text-white">{account.name} · {account.username}</p>
                  <p className="text-slate-400 text-sm">{account.email} · роль: {account.role} · статус: {account.status}</p>
                </div>
                {account.id !== user?.id && (
                  <Button
                    variant={account.status === "active" ? "destructive" : "outline"}
                    onClick={() => setUserStatus(account.id, account.status === "active" ? "blocked" : "active")}
                  >
                    {account.status === "active" ? "Заблокировать" : "Разблокировать"}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="mt-6"><Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><Button variant="destructive" onClick={logout} className="w-full">Выйти из профиля администратора</Button></CardContent></Card></TabsContent>
    </Tabs>
  );
}

export function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 py-12 text-center text-slate-300">Загрузка профиля...</div>;
  }

  if (!user) {
    return <AuthForms />;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl md:text-5xl mb-3 text-white">
          {user.role === "seller" ? "Кабинет продавца" : user.role === "admin" ? "Панель администратора" : "Личный кабинет"}
        </h1>
        <p className="text-slate-400 mb-8">Вы вошли как {user.name} · роль: {user.role}</p>
        {user.role === "seller" ? <SellerProfile /> : user.role === "admin" ? <AdminProfile /> : <CustomerProfile user={user} />}
      </div>
    </div>
  );
}
