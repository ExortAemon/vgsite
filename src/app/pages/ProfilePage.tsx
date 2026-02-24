import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { User, Package, Settings } from "lucide-react";
import { useState } from "react";

export function ProfilePage() {
  const [userData, setUserData] = useState({
    name: "Иван Иванов",
    email: "ivan@example.kz",
    phone: "+7 (777) 123-45-67"
  });

  const orders = [
    {
      id: "12345",
      date: "15.01.2026",
      status: "Доставлен",
      total: "72 300₸",
      items: 2
    },
    {
      id: "12344",
      date: "10.01.2026",
      status: "В пути",
      total: "39 900₸",
      items: 1
    },
    {
      id: "12343",
      date: "05.01.2026",
      status: "Доставлен",
      total: "102 700₸",
      items: 3
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl md:text-5xl mb-8 text-white">Личный Кабинет</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600">
              <User className="h-4 w-4 mr-2" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600">
              <Package className="h-4 w-4 mr-2" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600">
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Личная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Имя</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-300">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Сохранить изменения
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl text-white mb-2">Заказ #{order.id}</h3>
                        <p className="text-slate-400">Дата: {order.date}</p>
                        <p className="text-slate-400">Товаров: {order.items}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl text-emerald-400 mb-2">{order.total}</p>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            order.status === "Доставлен"
                              ? "bg-emerald-950 text-emerald-400"
                              : "bg-blue-950 text-blue-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Настройки аккаунта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full border-slate-700">
                  Изменить пароль
                </Button>
                <Button variant="outline" className="w-full border-slate-700">
                  Настройки уведомлений
                </Button>
                <Button variant="destructive" className="w-full">
                  Выйти из аккаунта
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
