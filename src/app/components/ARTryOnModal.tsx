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
    "https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/loaders/GLTFLoader.js?module",
    "https://esm.sh/three@0.153.0/examples/jsm/loaders/GLTFLoader.js?bundle",
    "https://esm.run/three@0.153.0/examples/jsm/loaders/GLTFLoader.js",
    "https://cdn.skypack.dev/three@0.153.0/examples/jsm/loaders/GLTFLoader.js",
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
  const templeOccludersRef = useRef<{ left: any; right: any } | null>(null);
  const yawFilteredRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
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

    if (resizeHandlerRef.current) {
      window.removeEventListener("resize", resizeHandlerRef.current);
      resizeHandlerRef.current = null;
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
    templeOccludersRef.current = null;
    yawFilteredRef.current = 0;
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
        const viewportAspect = sceneHost.clientWidth > 0 && sceneHost.clientHeight > 0
          ? sceneHost.clientWidth / sceneHost.clientHeight
          : 16 / 9;
        const camera = new THREE.PerspectiveCamera(45, viewportAspect, 0.1, 1000);
        camera.position.z = 6;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
        sceneHost.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const handleResize = () => {
          if (!rendererRef.current || !sceneHostRef.current) {
            return;
          }
          const width = sceneHostRef.current.clientWidth;
          const height = sceneHostRef.current.clientHeight;
          if (!width || !height) {
            return;
          }
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        };
        resizeHandlerRef.current = handleResize;
        window.addEventListener("resize", handleResize);

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
          if (modelLoadErrorMessage.includes("GLTF_LOADER_UNAVAILABLE") || modelLoadErrorMessage.includes("GLTF_LOADER_INCOMPATIBLE") || modelLoadErrorMessage.includes("GLTF_MODULE_TIMEOUT")) {
            throw new Error(modelLoadErrorMessage);
          }
          throw new Error(`MODEL_LOAD_FAILED:${modelLoadErrorMessage}`);
        }

        glasses.scale.setScalar(6.68);
        glasses.position.set(0, -0.1, 0.04);
        glasses.rotation.x = -0.08;

        const faceAnchor = new THREE.Group();
        faceAnchor.position.set(0, 0, -2.4);
        faceAnchor.add(glasses);

        // Occluders: hide only the side arms of the glasses behind the head without masking lenses.
        const occluderMaterial = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
          depthTest: true,
          side: THREE.DoubleSide,
        });
        const leftTempleOccluder = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 1.35), occluderMaterial);
        const rightTempleOccluder = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 1.35), occluderMaterial);
        leftTempleOccluder.position.set(-0.96, -0.01, -0.1);
        rightTempleOccluder.position.set(0.96, -0.01, -0.1);
        leftTempleOccluder.renderOrder = 0;
        rightTempleOccluder.renderOrder = 0;
        glasses.add(leftTempleOccluder);
        glasses.add(rightTempleOccluder);
        glasses.traverse((child: any) => {
          if (child?.isMesh && child !== leftTempleOccluder && child !== rightTempleOccluder) {
            child.renderOrder = 1;
          }
        });
        templeOccludersRef.current = { left: leftTempleOccluder, right: rightTempleOccluder };

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
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const leftInnerEye = landmarks[133] || leftEye;
        const rightInnerEye = landmarks[362] || rightEye;
        const leftTemple = landmarks[234];
        const rightTemple = landmarks[454];
        const forehead = landmarks[10];
        const chin = landmarks[152];
        const nose = landmarks[1];
        const noseBridge = landmarks[6] || nose;

        const leftEar = landmarks[127] || leftTemple;
        const rightEar = landmarks[356] || rightTemple;
        const templeMidX = (leftTemple.x + rightTemple.x) / 2;

        const eyeCenterX = (leftInnerEye.x + rightInnerEye.x) / 2;
        const eyeCenterY = (leftInnerEye.y + rightInnerEye.y) / 2;
        const eyeCenterZ = (leftInnerEye.z + rightInnerEye.z) / 2;

        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const eyeDistance = Math.sqrt(dx * dx + dy * dy);

        const positionSmoothFactor = 0.52;
        const rotationSmoothFactor = 0.52;
        const blendedFaceX = (noseBridge.x * 0.68) + (eyeCenterX * 0.2) + (templeMidX * 0.12);
        const yawAmount = rightTemple.z - leftTemple.z;
        const anchorTargetZ = THREE.MathUtils.clamp((-2.15 - (0.115 - eyeDistance) * 8.2), -3.2, -1.45);
        const depthFromCamera = camera.position.z - anchorTargetZ;
        const halfHeightAtDepth = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depthFromCamera;
        const halfWidthAtDepth = halfHeightAtDepth * camera.aspect;
        const rawYaw = THREE.MathUtils.clamp(yawAmount * 15.5, -1.08, 1.08);
        const yawDeadzone = 0.04;
        const yawAfterDeadzone = Math.abs(rawYaw) < yawDeadzone
          ? 0
          : Math.sign(rawYaw) * (Math.abs(rawYaw) - yawDeadzone);
        yawFilteredRef.current += (yawAfterDeadzone - yawFilteredRef.current) * 0.52;
        const targetYaw = yawFilteredRef.current;
        const anchorTargetX = ((blendedFaceX - 0.5) * 2 * halfWidthAtDepth) + (targetYaw * 0.16);
        const anchorTargetY = ((0.5 - noseBridge.y) * 2 * halfHeightAtDepth) - 0.34;

        if (faceAnchorRef.current) {
          faceAnchorRef.current.position.x += (anchorTargetX - faceAnchorRef.current.position.x) * positionSmoothFactor;
          faceAnchorRef.current.position.y += (anchorTargetY - faceAnchorRef.current.position.y) * positionSmoothFactor;
          faceAnchorRef.current.position.z += (anchorTargetZ - faceAnchorRef.current.position.z) * positionSmoothFactor;
        }

        const templeDx = rightTemple.x - leftTemple.x;
        const templeDy = rightTemple.y - leftTemple.y;
        const templeDz = rightTemple.z - leftTemple.z;
        const templeDistance = Math.sqrt((templeDx ** 2) + (templeDy ** 2) + (templeDz ** 2));
        const earDx = rightEar.x - leftEar.x;
        const earDy = rightEar.y - leftEar.y;
        const earDz = rightEar.z - leftEar.z;
        const earDistance = Math.sqrt((earDx ** 2) + (earDy ** 2) + (earDz ** 2));
        const targetScale = Math.max(eyeDistance * 91.2, templeDistance * 51.2, earDistance * 49.6, 7.84);
        const currentScale = modelRef.current.scale.x || targetScale;
        const limitedTargetScale = THREE.MathUtils.clamp(targetScale, currentScale * 0.96, currentScale * 1.04);
        modelRef.current.scale.x += (limitedTargetScale - modelRef.current.scale.x) * positionSmoothFactor;
        modelRef.current.scale.y += (limitedTargetScale - modelRef.current.scale.y) * positionSmoothFactor;
        modelRef.current.scale.z += (limitedTargetScale - modelRef.current.scale.z) * positionSmoothFactor;

        const targetRoll = THREE.MathUtils.clamp(-Math.atan2(dy, dx), -1.0, 1.0);
        const targetPitchFromNose = ((noseBridge.y - eyeCenterY) - 0.038) * -7.2;
        const targetPitchFromFaceHeight = (chin.y - forehead.y - 0.34) * 2.8;
        const targetPitch = THREE.MathUtils.clamp((targetPitchFromNose * 0.56) + (targetPitchFromFaceHeight * 0.44), -0.9, 0.9);

        const rotationTarget = faceAnchorRef.current || modelRef.current;
        rotationTarget.rotation.z += (targetRoll - rotationTarget.rotation.z) * rotationSmoothFactor;
        rotationTarget.rotation.y += (targetYaw - rotationTarget.rotation.y) * rotationSmoothFactor;
        rotationTarget.rotation.x += (targetPitch - rotationTarget.rotation.x) * rotationSmoothFactor;

        // Keep pitch in a sane range to avoid extreme flips on noisy frames.
        rotationTarget.rotation.x = THREE.MathUtils.clamp(rotationTarget.rotation.x, -0.95, 0.95);

        const yawNormalized = THREE.MathUtils.clamp(targetYaw / 1.18, -1, 1);
        const occluders = templeOccludersRef.current;
        if (occluders) {
          // In mirrored selfie mode, geometric z-comparison can be inverted visually.
          // Use filtered yaw sign for stable far-side detection in head turns.
          const leftIsFar = yawNormalized < 0;
          const turnAmount = Math.abs(yawNormalized);
          const farScale = 0.8 + turnAmount * 3.2;
          const nearScale = turnAmount > 0.12 ? 0.02 : 0.12;
          const farXOffset = 1.08;
          const nearXOffset = 0.66;

          const leftTargetScale = leftIsFar ? farScale : nearScale;
          const rightTargetScale = leftIsFar ? nearScale : farScale;
          const leftTargetX = leftIsFar ? -farXOffset : -nearXOffset;
          const rightTargetX = leftIsFar ? nearXOffset : farXOffset;

          occluders.left.position.x += (leftTargetX - occluders.left.position.x) * positionSmoothFactor;
          occluders.right.position.x += (rightTargetX - occluders.right.position.x) * positionSmoothFactor;
          occluders.left.scale.x += ((leftTargetScale * 0.85) - occluders.left.scale.x) * positionSmoothFactor;
          occluders.right.scale.x += ((rightTargetScale * 0.85) - occluders.right.scale.x) * positionSmoothFactor;
          occluders.left.scale.y += ((leftTargetScale * 0.9) - occluders.left.scale.y) * positionSmoothFactor;
          occluders.right.scale.y += ((rightTargetScale * 0.9) - occluders.right.scale.y) * positionSmoothFactor;
          occluders.left.scale.z += ((leftTargetScale) - occluders.left.scale.z) * positionSmoothFactor;
          occluders.right.scale.z += ((rightTargetScale) - occluders.right.scale.z) * positionSmoothFactor;
        }

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
          setStatusMessage("Не удалось загрузить GLTFLoader. Проверьте локальные /vendor/three.min.js + /vendor/GLTFLoader.js (или .module.js), либо доступ к esm.sh/esm.run/skypack/jspm/jsDelivr/unpkg.");
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
