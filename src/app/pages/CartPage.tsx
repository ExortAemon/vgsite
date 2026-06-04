import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Trash2, Plus, Minus } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, CartPayload, formatPrice } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { AuthForms } from "@/app/components/AuthForms";

export function CartPage() {
  const [cart, setCart] = useState<CartPayload>({ items: [], total_kzt: 0 });
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const loadCart = async () => {
    const data = await apiRequest<{ cart: CartPayload }>("/cart.php");
    setCart(data.cart);
  };

  useEffect(() => {
    if (user?.role === "customer") {
      loadCart().catch((error) => alert(error instanceof Error ? error.message : "Не удалось загрузить корзину."));
    }
  }, [user]);

  const updateQuantity = async (itemId: number, quantity: number) => {
    const data = await apiRequest<{ cart: CartPayload }>("/cart.php", {
      method: "POST",
      body: JSON.stringify({ action: "quantity", item_id: itemId, quantity })
    });
    setCart(data.cart);
  };

  const removeItem = async (itemId: number) => {
    const data = await apiRequest<{ cart: CartPayload }>("/cart.php", {
      method: "POST",
      body: JSON.stringify({ action: "remove", item_id: itemId })
    });
    setCart(data.cart);
  };

  const createOrder = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ success: boolean }>("/orders.php", {
        method: "POST",
        body: JSON.stringify({ action: "create", delivery_address: deliveryAddress, comment })
      });
      if (data.success) {
        alert("Заказ создан. Продавец увидит его в личном кабинете.");
        setCart({ items: [], total_kzt: 0 });
        navigate("/profile");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось оформить заказ.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-900 py-12 text-center text-slate-300">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AuthForms
            compact
            title="Войдите или зарегистрируйтесь для заказа"
            description="Корзина показывает форму входа и регистрации сразу здесь: без аккаунта заказать очки нельзя, потому что заказ должен быть привязан к покупателю, телефону, email и истории покупок."
          />
        </div>
      </div>
    );
  }

  if (user.role !== "customer") {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <h1 className="text-3xl text-white mb-4">Корзина недоступна для служебного профиля</h1>
              <p className="text-slate-400 mb-6">Продавец и администратор работают с заказами и действиями пользователей в личном кабинете.</p>
              <Link to="/profile">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Перейти в кабинет</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl mb-8 text-white">Корзина</h1>

        {cart.items.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <p className="text-xl text-slate-400 mb-6">Ваша корзина пуста</p>
              <Link to="/catalog">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Перейти в каталог</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0">
                        <ImageWithFallback src={item.main_image_url || ""} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl text-white mb-2">{item.name}</h3>
                        <p className="text-emerald-400 text-lg">{formatPrice(item.unit_price_kzt)}</p>
                        <div className="flex items-center gap-2 mt-4">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-white w-12 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="bg-slate-800 border-slate-700 sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-2xl text-white mb-4">Оформление</h2>
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="deliveryAddress" className="text-slate-300">Адрес доставки</Label>
                      <Input
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        placeholder="Город, улица, дом, квартира"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="comment" className="text-slate-300">Комментарий</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Удобное время, пожелания к доставке"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-slate-300">
                      <span>Товары:</span>
                      <span>{formatPrice(cart.total_kzt)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Доставка:</span>
                      <span className="text-emerald-400">Бесплатно</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 mt-2">
                      <div className="flex justify-between text-white text-xl">
                        <span>Общая сумма:</span>
                        <span className="text-emerald-400">{formatPrice(cart.total_kzt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={createOrder} disabled={isLoading || deliveryAddress.trim() === ""}>
                    {isLoading ? "Создаем заказ..." : "Оформить заказ"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
