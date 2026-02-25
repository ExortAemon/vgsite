import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";

interface ARTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  modelName: string;
  modelUrl: string;
}

declare global {
  interface Window {
    THREE?: any;
    FaceMesh?: any;
    Camera?: any;
  }
}

const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.ready === "true") {
      resolve();
      return;
    }
    existing.addEventListener("load", () => resolve(), { once: true });
    existing.addEventListener("error", () => reject(new Error(`Не удалось загрузить ${src}`)), { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = () => {
    script.dataset.ready = "true";
    resolve();
  };
  script.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
  document.body.appendChild(script);
});

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const loadScriptWithFallback = async (urls: string[]) => {
  let lastError: unknown;
  for (const url of urls) {
    try {
      await withTimeout(loadScript(url), 9000, `SCRIPT_TIMEOUT:${url}`);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export function ARTryOnModal({ isOpen, onClose, productName, modelName, modelUrl }: ARTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneHostRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<any>(null);
  const cameraLoopRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Нажмите «Включить камеру» и разрешите доступ к камере");

  const waitForSceneElements = useCallback(async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (videoRef.current && sceneHostRef.current) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    return false;
  }, []);

  const cleanup = useCallback(() => {
    if (cameraLoopRef.current?.stop) {
      cameraLoopRef.current.stop();
    }
    cameraLoopRef.current = null;

    if (faceMeshRef.current?.close) {
      faceMeshRef.current.close();
    }
    faceMeshRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    mediaStreamRef.current = null;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement?.remove();
    }
    rendererRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    modelRef.current = null;
    setCameraEnabled(false);
    setInitializing(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setStatusMessage("Нажмите «Включить камеру» и разрешите доступ к камере");
    }
  }, [cleanup, isOpen]);

  const getCameraErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error) {
      if (error.message === "INSECURE_CONTEXT") {
        return "Камера недоступна: откройте сайт по HTTPS или localhost.";
      }
      if (error.message === "BROWSER_UNSUPPORTED") {
        return "Ваш браузер не поддерживает доступ к камере (getUserMedia).";
      }
      if (error.message === "CAMERA_PERMISSION_TIMEOUT") {
        return "Нет ответа на запрос камеры. Проверьте блокировку разрешений камеры в браузере и попробуйте снова.";
      }
    }

    const mediaError = error as DOMException | undefined;
    if (!window.isSecureContext) {
      return "Камера недоступна: нужен HTTPS (или localhost).";
    }
    if (!mediaError?.name) {
      return "Не удалось включить камеру. Разрешите доступ и попробуйте снова.";
    }
    if (mediaError.name === "NotAllowedError") {
      return "Доступ к камере запрещён. Разрешите камеру в адресной строке браузера и попробуйте снова.";
    }
    if (mediaError.name === "NotFoundError") {
      return "Камера не найдена. Подключите камеру и попробуйте снова.";
    }
    if (mediaError.name === "NotReadableError") {
      return "Камера занята другим приложением. Закройте другие приложения и повторите.";
    }
    return `Не удалось включить камеру (${mediaError.name}).`;
  }, []);

  const startCamera = useCallback(async () => {
    const elementsReady = await waitForSceneElements();
    if (!elementsReady || !videoRef.current || !sceneHostRef.current) {
      setStatusMessage("Не удалось запустить AR: не готов контейнер видео. Нажмите кнопку ещё раз.");
      return;
    }

    cleanup();
    setInitializing(true);
    setStatusMessage("Запрашиваем доступ к камере...");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("BROWSER_UNSUPPORTED");
      }
      if (!window.isSecureContext) {
        throw new Error("INSECURE_CONTEXT");
      }

      const video = videoRef.current;
      const sceneHost = sceneHostRef.current;

      const mediaStream = await withTimeout(
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        }),
        12000,
        "CAMERA_PERMISSION_TIMEOUT",
      );
      mediaStreamRef.current = mediaStream;

      video.srcObject = mediaStream;
      await video.play();
      setCameraEnabled(true);

      setStatusMessage("Камера включена. Инициализируем AR...");

      try {
        await loadScriptWithFallback([
          "https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js",
          "https://unpkg.com/three@0.153.0/build/three.min.js",
        ]);
        await loadScriptWithFallback([
          "https://cdn.jsdelivr.net/npm/three@0.153.0/examples/js/loaders/GLTFLoader.js",
          "https://unpkg.com/three@0.153.0/examples/js/loaders/GLTFLoader.js",
        ]);
        await loadScriptWithFallback([
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
          "https://unpkg.com/@mediapipe/face_mesh/face_mesh.js",
        ]);
        await loadScriptWithFallback([
          "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
          "https://unpkg.com/@mediapipe/camera_utils/camera_utils.js",
        ]);

        const THREE = window.THREE;
        if (!THREE || !window.FaceMesh || !window.Camera) {
          throw new Error("AR библиотеки не загружены");
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
        camera.position.z = 6;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
        sceneHost.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        scene.add(new THREE.AmbientLight(0xffffff, 1.1));
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(0, 1, 2);
        scene.add(keyLight);

        const createFallbackGlasses = () => {
          const group = new THREE.Group();
          const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.4, roughness: 0.4 });
          const bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.35 });

        const leftLens = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 16, 40), frameMaterial);
        leftLens.position.set(-0.45, 0, 0);
        const rightLens = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 16, 40), frameMaterial);
        rightLens.position.set(0.45, 0, 0);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.05), bridgeMaterial);
        bridge.position.set(0, 0, 0);
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), frameMaterial);
        leftArm.position.set(-0.9, 0.08, -0.05);
        leftArm.rotation.y = 0.45;
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), frameMaterial);
        rightArm.position.set(0.9, 0.08, -0.05);
        rightArm.rotation.y = -0.45;

        group.add(leftLens, rightLens, bridge, leftArm, rightArm);
        return group;
      };

        let glasses: any;
        let usedFallback = false;
        try {
          if (!modelUrl) {
            throw new Error("missing modelUrl");
          }

          const loader = new THREE.GLTFLoader();
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(modelUrl, resolve, undefined, reject);
          });
          glasses = gltf.scene;
        } catch {
          glasses = createFallbackGlasses();
          usedFallback = true;
          setStatusMessage(`Модель ${modelName || "товара"} недоступна, используем встроенную 3D-оправу.`);
        }

        glasses.scale.setScalar(1.3);
        scene.add(glasses);
        modelRef.current = glasses;

        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMeshRef.current = faceMesh;

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks?.length || !modelRef.current) {
          renderer.render(scene, camera);
          return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const centerX = (leftEye.x + rightEye.x) / 2;
        const centerY = (leftEye.y + rightEye.y) / 2;

        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const eyeDistance = Math.sqrt(dx * dx + dy * dy);

        const smoothFactor = 0.6;
        modelRef.current.position.x += ((centerX - 0.5) * 6 - modelRef.current.position.x) * smoothFactor;
        modelRef.current.position.y += (-(centerY - 0.5) * 4 - modelRef.current.position.y) * smoothFactor;

        const targetScale = eyeDistance * 8;
        modelRef.current.scale.x += (targetScale - modelRef.current.scale.x) * smoothFactor;
        modelRef.current.scale.y += (targetScale - modelRef.current.scale.y) * smoothFactor;
        modelRef.current.scale.z = modelRef.current.scale.x;

        const targetRotation = -Math.atan2(dy, dx);
        modelRef.current.rotation.z += (targetRotation - modelRef.current.rotation.z) * smoothFactor;

        renderer.render(scene, camera);
      });

        const faceCamera = new window.Camera(video, {
          onFrame: async () => {
            if (faceMeshRef.current) {
              await faceMeshRef.current.send({ image: video });
            }
          },
          width: 1280,
          height: 720,
        });

        cameraLoopRef.current = faceCamera;
        faceCamera.start();

        if (usedFallback) {
          setStatusMessage(`Модель ${modelName || "товара"} недоступна, используем встроенную 3D-оправу. Трекинг лица активен.`);
        } else {
          setStatusMessage(`AR активна: ${modelName}`);
        }
      } catch {
        setStatusMessage("Камера включена, но AR-трекинг не инициализировался. Проверьте интернет/CDN и нажмите «Включить камеру» ещё раз.");
      }
    } catch (error) {
      cleanup();
      setStatusMessage(getCameraErrorMessage(error));
    } finally {
      setInitializing(false);
    }
  }, [cleanup, getCameraErrorMessage, modelName, modelUrl, waitForSceneElements]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Виртуальная примерка - {productName}</DialogTitle>
          <DialogDescription>Включите камеру и примерьте очки в режиме дополненной реальности</DialogDescription>
        </DialogHeader>

        <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: "500px" }}>
          <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${cameraEnabled ? "block" : "hidden"}`} autoPlay playsInline muted />
          <div ref={sceneHostRef} className={`absolute inset-0 ${cameraEnabled ? "block" : "hidden"}`} />

          {!cameraEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 bg-slate-900/90 px-6">
              <Camera className="h-20 w-20 mb-4 text-slate-400" />
              <p className="text-lg mb-2">Готово к AR-примерке</p>
              <p className="text-sm">Модель: {modelName || "не выбрана"}</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">Источник: {modelUrl || "не задан"}</p>
              <p className="text-sm text-center text-slate-300">Нажмите кнопку ниже, чтобы запустить камеру и закрепить 3D-модель за лицом.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <p className="text-sm text-slate-400">{statusMessage}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Закрыть
            </Button>
            <Button onClick={startCamera} disabled={initializing}>
              {initializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {initializing ? "Запуск..." : "Включить камеру"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
