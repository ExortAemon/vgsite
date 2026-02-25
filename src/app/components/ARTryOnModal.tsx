import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useMemo } from "react";

interface ARTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  modelName: string;
  modelUrl: string;
}

export function ARTryOnModal({ isOpen, onClose, productName, modelName, modelUrl }: ARTryOnModalProps) {
  const trackingSnippet = useMemo(
    () => `const modelByProduct = {
  "${productName}": "${modelUrl}"
};

const activeModelUrl = modelByProduct["${productName}"];
// activeModel загружается из activeModelUrl через GLTFLoader.

faceMesh.onResults(results => {
  if (!results.multiFaceLandmarks.length || !activeModel) return;

  const landmarks = results.multiFaceLandmarks[0];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const centerX = (leftEye.x + rightEye.x) / 2;
  const centerY = (leftEye.y + rightEye.y) / 2;

  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const eyeDistance = Math.sqrt(dx * dx + dy * dy);
  const smoothFactor = 0.6;

  activeModel.position.x += ((centerX - 0.5) * 6 - activeModel.position.x) * smoothFactor;
  activeModel.position.y += (-(centerY - 0.5) * 4 - activeModel.position.y) * smoothFactor;

  const targetScale = eyeDistance * 8;
  activeModel.scale.x += (targetScale - activeModel.scale.x) * smoothFactor;
  activeModel.scale.y += (targetScale - activeModel.scale.y) * smoothFactor;
  activeModel.scale.z = activeModel.scale.x;

  const targetRotation = -Math.atan2(dy, dx);
  activeModel.rotation.z += (targetRotation - activeModel.rotation.z) * smoothFactor;

  renderer.render(scene, camera);
});`,
    [modelUrl, productName],
  );

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
            <p className="text-sm mb-1">Выбранная 3D модель: {modelName || "не выбрана"}</p>
            <p className="text-xs mb-3">Файл модели: {modelUrl || "не задан"}</p>
            <p className="text-sm text-slate-400">
              Ниже готовый шаблон трекинга с привязкой модели к товару
            </p>
            <pre className="mt-3 max-w-3xl overflow-auto rounded-md bg-slate-900/90 p-3 text-left text-[11px] text-slate-100">
              <code>{trackingSnippet}</code>
            </pre>
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
