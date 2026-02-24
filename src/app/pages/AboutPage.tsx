import { Card, CardContent } from "@/app/components/ui/card";
import { Award, Users, Target, Heart } from "lucide-react";

export function AboutPage() {
  const values = [
    {
      icon: Award,
      title: "Качество",
      description: "Мы предлагаем только проверенные бренды и качественные товары"
    },
    {
      icon: Users,
      title: "Клиентоориентированность",
      description: "Наши клиенты - наш приоритет номер один"
    },
    {
      icon: Target,
      title: "Инновации",
      description: "Используем новейшие технологии для вашего комфорта"
    },
    {
      icon: Heart,
      title: "Страсть",
      description: "Мы любим то, что мы делаем, и делаем это с душой"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl mb-6 text-white text-center">О Нас</h1>
          <p className="text-xl text-slate-400 text-center mb-12">
            Ваш надежный партнер в мире качественных очков
          </p>

          <Card className="bg-slate-800 border-slate-700 mb-12">
            <CardContent className="p-8">
              <h2 className="text-3xl text-emerald-400 mb-4">Наша История</h2>
              <p className="text-slate-300 mb-4">
                EyeWear была основана в 2020 году с простой миссией - сделать качественные очки доступными для всех.
                Мы начали с небольшого магазина в Алматы и быстро выросли в одну из ведущих компаний в Казахстане.
              </p>
              <p className="text-slate-300 mb-4">
                Сегодня мы предлагаем широкий ассортимент солнцезащитных и оптических очков от лучших мировых брендов.
                Наша команда экспертов тщательно отбирает каждую модель, чтобы гарантировать высочайшее качество и стиль.
              </p>
              <p className="text-slate-300">
                Мы гордимся тем, что помогли тысячам клиентов найти идеальные очки, которые не только защищают их зрение,
                но и подчеркивают их индивидуальность.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-3xl text-white mb-8 text-center">Наши Ценности</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-emerald-950 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl text-white mb-2">{value.title}</h3>
                    <p className="text-slate-400">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
