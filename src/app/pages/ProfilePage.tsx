import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Shield, User, Package, Settings, Store, Activity, Users, ClipboardList } from "lucide-react";
import { AdminAction, apiRequest, formatPrice, Order, User as ApiUser } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { AuthForms } from "@/app/components/AuthForms";

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

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_kzt), 0);
  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;

  if (orders.length === 0) {
    return <Card className="bg-slate-800 border-slate-700"><CardContent className="p-8 text-slate-400">Заказов пока нет.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {isSeller && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700"><CardContent className="p-5"><p className="text-slate-400">Всего заказов</p><p className="text-3xl text-white">{orders.length}</p></CardContent></Card>
          <Card className="bg-slate-800 border-slate-700"><CardContent className="p-5"><p className="text-slate-400">В работе</p><p className="text-3xl text-emerald-400">{activeOrders}</p></CardContent></Card>
          <Card className="bg-slate-800 border-slate-700"><CardContent className="p-5"><p className="text-slate-400">Сумма заказов</p><p className="text-3xl text-emerald-400">{formatPrice(totalRevenue)}</p></CardContent></Card>
        </div>
      )}
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
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-sm uppercase tracking-wide">Версия сайта для продавца</p>
            <h2 className="text-3xl text-white mt-2">Работа с заказами покупателей</h2>
            <p className="text-slate-400 mt-2">В этом профиле нет каталога магазина и корзины: продавец видит все заказы из базы данных и меняет их статусы.</p>
          </div>
          <Button variant="destructive" onClick={logout}>Выйти из профиля продавца</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600"><Store className="h-4 w-4 mr-2" />Все заказы</TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-emerald-600"><ClipboardList className="h-4 w-4 mr-2" />Как работать</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6"><OrdersList isSeller /></TabsContent>
        <TabsContent value="help" className="mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-slate-300 space-y-2">
              <p>1. Откройте вкладку «Все заказы».</p>
              <p>2. Найдите заказ по номеру, имени клиента или дате.</p>
              <p>3. В правой части карточки выберите новый статус: «В обработке», «В пути», «Доставлен» или «Отменен».</p>
              <p>Все изменения сохраняются в MySQL и отображаются покупателю в его личном кабинете.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminProfile() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("all");

  const loadAdminData = async () => {
    const data = await apiRequest<{ users: ApiUser[]; actions: AdminAction[] }>("/admin.php");
    setUsers(data.users);
    setActions(data.actions);
  };

  useEffect(() => {
    loadAdminData().catch((error) => alert(error instanceof Error ? error.message : "Не удалось загрузить админ-данные."));
  }, []);

  const filteredActions = useMemo(() => {
    if (selectedUserId === "all") {
      return actions;
    }
    if (selectedUserId === "guest") {
      return actions.filter((action) => !action.username);
    }
    const account = users.find((item) => String(item.id) === selectedUserId);
    return actions.filter((action) => action.username === account?.username);
  }, [actions, selectedUserId, users]);

  const setUserStatus = async (userId: number, status: "active" | "blocked") => {
    await apiRequest("/admin.php", {
      method: "POST",
      body: JSON.stringify({ action: "set_user_status", user_id: userId, status })
    });
    await loadAdminData();
  };

  const setUserRole = async (userId: number, role: ApiUser["role"]) => {
    await apiRequest("/admin.php", {
      method: "POST",
      body: JSON.stringify({ action: "set_user_role", user_id: userId, role })
    });
    await loadAdminData();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-sm uppercase tracking-wide">Упрощенная версия сайта для администратора</p>
            <h2 className="text-3xl text-white mt-2">Действия пользователей и администрирование</h2>
            <p className="text-slate-400 mt-2">Здесь специально нет витрины товаров и корзины: администратор работает только с журналом действий и аккаунтами.</p>
          </div>
          <Button variant="destructive" onClick={logout}>Выйти из профиля администратора</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-5"><p className="text-slate-400">Пользователей</p><p className="text-3xl text-white">{users.length}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-5"><p className="text-slate-400">Заблокировано</p><p className="text-3xl text-red-400">{users.filter((account) => account.status === "blocked").length}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-5"><p className="text-slate-400">Записей журнала</p><p className="text-3xl text-emerald-400">{actions.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="actions" className="data-[state=active]:bg-emerald-600"><Activity className="h-4 w-4 mr-2" />Действия</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-emerald-600"><Users className="h-4 w-4 mr-2" />Пользователи</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Действия по каждому пользователю</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Фильтр пользователя</Label>
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="mt-2 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white">
                  <option value="all">Все пользователи</option>
                  <option value="guest">Гости и неуспешные входы</option>
                  {users.map((account) => <option key={account.id} value={account.id}>{account.username} · {account.name} · {account.role}</option>)}
                </select>
              </div>
              {filteredActions.length === 0 ? (
                <p className="text-slate-400">По выбранному пользователю действий пока нет.</p>
              ) : filteredActions.map((action) => (
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
                    <div className="flex flex-wrap items-center gap-3">
                      <select value={account.role} onChange={(event) => setUserRole(account.id, event.target.value as ApiUser["role"])} className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-white">
                        <option value="customer">Покупатель</option>
                        <option value="seller">Продавец</option>
                        <option value="admin">Администратор</option>
                      </select>
                      <Button
                        variant={account.status === "active" ? "destructive" : "outline"}
                        onClick={() => setUserStatus(account.id, account.status === "active" ? "blocked" : "active")}
                      >
                        {account.status === "active" ? "Заблокировать" : "Разблокировать"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (!user) {
    return (
      <AuthForms
        description={isLoading
          ? "Проверяем текущий вход. Формы уже доступны: войдите в аккаунт или зарегистрируйтесь, чтобы получить личный кабинет и оформлять заказы."
          : "Просматривать товары можно без входа, но оформление заказа и личный кабинет доступны только зарегистрированным покупателям."
        }
      />
    );
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
