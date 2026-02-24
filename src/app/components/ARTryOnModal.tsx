import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface ARTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export function ARTryOnModal({ isOpen, onClose, productName }: ARTryOnModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Виртуальная примерка - {productName}</DialogTitle>
          <DialogDescription>
            Включите камеру и примерьте очки в режиме дополненной реальности
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
          {/* Placeholder для веб-камеры и AR */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Camera className="h-24 w-24 mb-4 text-slate-400" />
            <p className="text-lg mb-2">Здесь будет отображаться AR примерка</p>
            <p className="text-sm text-slate-400">
              Добавьте свой код для веб-камеры и 3D модели очков
            </p>
          </div>
          
          {/* Контейнер для видео с веб-камеры */}
          <video 
            id="ar-video" 
            className="w-full h-full object-cover hidden" 
            autoPlay 
            playsInline
          />
          
          {/* Canvas для наложения 3D очков */}
          <canvas 
            id="ar-canvas" 
            className="absolute inset-0 w-full h-full hidden"
          />
        </div>
        
        <div className="flex gap-4 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Закрыть
          </Button>
          <Button>
            <Camera className="mr-2 h-4 w-4" />
            Включить камеру
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
