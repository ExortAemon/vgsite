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
      return url;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const loadGltfLoaderClass = async () => {
  const legacyScriptUrls = [
    "/vendor/GLTFLoader.js",
    "https://threejs.org/examples/js/loaders/GLTFLoader.js",
    "https://cdn.jsdelivr.net/npm/three@0.153.0/examples/js/loaders/GLTFLoader.js",
    "https://unpkg.com/three@0.153.0/examples/js/loaders/GLTFLoader.js",
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r153/examples/js/loaders/GLTFLoader.js",
    "https://raw.githubusercontent.com/mrdoob/three.js/r153/examples/js/loaders/GLTFLoader.js",
  ];

  try {
    await loadScriptWithFallback(legacyScriptUrls);
    if (window.THREE?.GLTFLoader) {
      return window.THREE.GLTFLoader;
    }
  } catch {
    // try ESM fallbacks below
  }

  const moduleUrls = [
    "/vendor/GLTFLoader.module.js",
    "https://esm.sh/three@0.153.0/examples/jsm/loaders/GLTFLoader.js?bundle",
    "https://ga.jspm.io/npm:three@0.153.0/examples/jsm/loaders/GLTFLoader.js",
    "https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/loaders/GLTFLoader.js",
    "https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js",
    "https://raw.githubusercontent.com/mrdoob/three.js/r153/examples/jsm/loaders/GLTFLoader.js",
  ];

  let lastError: unknown;
  for (const moduleUrl of moduleUrls) {
    try {
      const moduleExports = await withTimeout(
        import(/* @vite-ignore */ moduleUrl),
        9000,
        `GLTF_MODULE_TIMEOUT:${moduleUrl}`,
      );

      const loaderClass = moduleExports?.GLTFLoader || moduleExports?.default;
      if (loaderClass) {
        return loaderClass;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("GLTF_LOADER_UNAVAILABLE");
};

export function ARTryOnModal({ isOpen, onClose, productName, modelName, modelUrl }: ARTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneHostRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<any>(null);
  const cameraLoopRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const faceAnchorRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const faceDetectedRef = useRef(false);
  const noFaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingConfirmedRef = useRef(false);

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

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (noFaceTimerRef.current) {
      clearTimeout(noFaceTimerRef.current);
      noFaceTimerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    modelRef.current = null;
    faceAnchorRef.current = null;
    faceDetectedRef.current = false;
    trackingConfirmedRef.current = false;
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
          "/vendor/three.min.js",
          "https://threejs.org/build/three.min.js",
          "https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js",
          "https://unpkg.com/three@0.153.0/build/three.min.js",
        ]);
        let GLTFLoaderClass: any = null;
        try {
          GLTFLoaderClass = await loadGltfLoaderClass();
        } catch {
          GLTFLoaderClass = null;
        }
        const faceMeshScriptUrl = await loadScriptWithFallback([
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

        const normalizeModel = (object3D: any) => {
          const box = new THREE.Box3().setFromObject(object3D);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          object3D.position.sub(center);

          const maxSize = Math.max(size.x || 1, size.y || 1, size.z || 1);
          const normalizeScale = 0.8 / maxSize;
          object3D.scale.multiplyScalar(normalizeScale);
        };

        let glasses: any;
        let loadedModelSource = "";
        let modelLoadErrorMessage = "";
        try {
          if (!modelUrl) {
            throw new Error("missing modelUrl");
          }

          if (!GLTFLoaderClass) {
            throw new Error("GLTF_LOADER_UNAVAILABLE");
          }

          const modelCandidates = modelUrl
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean);

          let gltf: any = null;
          let modelLoadError: unknown = null;
          for (const candidateUrl of modelCandidates) {
            try {
              const loader = new GLTFLoaderClass();
              gltf = await withTimeout(
                new Promise<any>((resolve, reject) => {
                  loader.load(candidateUrl, resolve, undefined, reject);
                }),
                9000,
                `MODEL_LOAD_TIMEOUT:${candidateUrl}`,
              );
              loadedModelSource = candidateUrl;
              break;
            } catch (error) {
              modelLoadError = error;
            }
          }

          if (!gltf) {
            throw modelLoadError || new Error("MODEL_LOAD_FAILED");
          }

          glasses = gltf.scene;
          normalizeModel(glasses);
        } catch (error) {
          modelLoadErrorMessage = error instanceof Error ? error.message : "MODEL_LOAD_FAILED";
          throw new Error(`MODEL_LOAD_FAILED:${modelLoadErrorMessage}`);
        }

        glasses.scale.setScalar(9.25);
        glasses.position.set(0, -0.24, 0.08);
        glasses.rotation.x = -0.12;

        const faceAnchor = new THREE.Group();
        faceAnchor.position.set(0, 0, -2.4);
        faceAnchor.add(glasses);
        scene.add(faceAnchor);

        faceAnchorRef.current = faceAnchor;
        modelRef.current = glasses;
        faceDetectedRef.current = false;

        noFaceTimerRef.current = setTimeout(() => {
          if (!faceDetectedRef.current && !trackingConfirmedRef.current) {
            setStatusMessage("Камера включена, но лицо не найдено. Держите лицо в центре кадра и при хорошем свете.");
          }
        }, 4500);

        const renderLoop = () => {
          renderer.render(scene, camera);
          animationFrameRef.current = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        const faceMeshAssetsBase = faceMeshScriptUrl
          ? faceMeshScriptUrl.replace(/face_mesh\.js.*$/, "")
          : "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/";

        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => `${faceMeshAssetsBase}${file}`,
        });
        faceMeshRef.current = faceMesh;

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        faceMesh.onResults((results: any) => {
          if (!results.multiFaceLandmarks?.length || !modelRef.current) {
            return;
          }

          faceDetectedRef.current = true;

          if (!trackingConfirmedRef.current) {
            trackingConfirmedRef.current = true;
            if (noFaceTimerRef.current) {
              clearTimeout(noFaceTimerRef.current);
              noFaceTimerRef.current = null;
            }
            setStatusMessage(`Трекинг лица активен: ${modelName}. Источник модели: ${loadedModelSource}`);
          }

        const landmarks = results.multiFaceLandmarks[0];
        const leftEye = landmarks[468] || landmarks[33];
        const rightEye = landmarks[473] || landmarks[263];
        const leftTemple = landmarks[234];
        const rightTemple = landmarks[454];
        const forehead = landmarks[10];
        const chin = landmarks[152];
        const nose = landmarks[1];
        const noseBridge = landmarks[6] || nose;

        const leftEar = landmarks[127] || leftTemple;
        const rightEar = landmarks[356] || rightTemple;

        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const eyeDistance = Math.sqrt(dx * dx + dy * dy);

        const smoothFactor = 0.26;
        const mirroredNoseX = 1 - noseBridge.x;
        const yawAmount = rightTemple.z - leftTemple.z;
        const anchorTargetX = ((mirroredNoseX - 0.5) * 4.4);
        const anchorTargetY = (-(noseBridge.y - 0.5) * 3.1 - 0.34);
        const anchorTargetZ = (-noseBridge.z * 8.2 - 2.05 + Math.abs(yawAmount) * 0.55);

        if (faceAnchorRef.current) {
          faceAnchorRef.current.position.x += (anchorTargetX - faceAnchorRef.current.position.x) * smoothFactor;
          faceAnchorRef.current.position.y += (anchorTargetY - faceAnchorRef.current.position.y) * smoothFactor;
          faceAnchorRef.current.position.z += (anchorTargetZ - faceAnchorRef.current.position.z) * smoothFactor;
        }

        const templeDx = rightTemple.x - leftTemple.x;
        const templeDy = rightTemple.y - leftTemple.y;
        const templeDz = rightTemple.z - leftTemple.z;
        const faceWidth = Math.sqrt((templeDx ** 2) + (templeDy ** 2) + (templeDz ** 2));
        const earDx = rightEar.x - leftEar.x;
        const earDy = rightEar.y - leftEar.y;
        const earDz = rightEar.z - leftEar.z;
        const earDistance = Math.sqrt((earDx ** 2) + (earDy ** 2) + (earDz ** 2));
        const targetScale = Math.max(eyeDistance * 165, faceWidth * 90, earDistance * 90, 11.5);
        const targetScaleX = targetScale * 1.14;
        modelRef.current.scale.x += (targetScaleX - modelRef.current.scale.x) * smoothFactor;
        modelRef.current.scale.y += (targetScale - modelRef.current.scale.y) * smoothFactor;
        modelRef.current.scale.z += (targetScale - modelRef.current.scale.z) * smoothFactor;

        const targetRoll = -Math.atan2(dy, dx);
        const targetYaw = yawAmount * 1.9;
        const targetPitch = -(chin.y - forehead.y - 0.33) * 2.2;

        const targetModelZOffset = 0.08 + Math.abs(targetYaw) * 0.16;
        modelRef.current.position.z += (targetModelZOffset - modelRef.current.position.z) * smoothFactor;

        const targetModelYOffset = -0.24 - Math.abs(targetPitch) * 0.03;
        modelRef.current.position.y += (targetModelYOffset - modelRef.current.position.y) * smoothFactor;

        const rotationTarget = faceAnchorRef.current || modelRef.current;
        rotationTarget.rotation.z += (targetRoll - rotationTarget.rotation.z) * smoothFactor;
        rotationTarget.rotation.y += (targetYaw - rotationTarget.rotation.y) * smoothFactor;
        rotationTarget.rotation.x += (targetPitch - rotationTarget.rotation.x) * smoothFactor;

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

        setStatusMessage(`AR запущена: ${modelName}. Загружено из ${loadedModelSource}.`);
      } catch (arError) {
        const reason = arError instanceof Error ? arError.message : "неизвестная ошибка";
        if (reason.includes("onBuild")) {
          setStatusMessage("AR не инициализирован: конфликт версий GLTFLoader/Three.js. Обновите страницу (Ctrl+F5) и попробуйте снова.");
        } else if (reason.includes("GLTF_LOADER_UNAVAILABLE") || reason.includes("GLTF_LOADER_INCOMPATIBLE") || reason.includes("GLTF_MODULE_TIMEOUT")) {
          setStatusMessage("Не удалось загрузить GLTFLoader. Проверьте /vendor/three.min.js и /vendor/GLTFLoader.js, либо доступ к esm.sh/jspm/jsDelivr/unpkg.");
        } else if (reason.includes("MODEL_LOAD_FAILED:")) {
          setStatusMessage(`Не удалось загрузить вашу 3D-модель (${reason.replace("MODEL_LOAD_FAILED:", "")}). Проверьте, что файл .glb корректный и доступен по URL.`);
        } else {
          setStatusMessage(`Камера включена, но AR-трекинг не инициализировался (${reason}). Нажмите «Включить камеру» ещё раз.`);
        }
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
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${cameraEnabled ? "block" : "hidden"}`}
            style={{ transform: "scaleX(-1)" }}
            autoPlay
            playsInline
            muted
          />
          <div
            ref={sceneHostRef}
            className={`absolute inset-0 ${cameraEnabled ? "block" : "hidden"}`}
            style={{ transform: "scaleX(-1)" }}
          />

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
