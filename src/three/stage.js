// Motor 3D compartido: un solo WebGL para todos los personajes de la página.
// Cada personaje tiene su propio <canvas> 2D en la página (así scrollea y se superpone como
// cualquier elemento) y el motor lo dibuja ahí copiando desde un único renderer de three.js.
// El modelo se descarga una sola vez y se clona para cada lugar.

import { pointer, prefersReducedMotion } from '../pointer'
import { whenLoaded } from '../components/Loader'

const MODEL_URL = '/models/valen.glb'
const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v))

export function supports3D() {
  if (typeof window === 'undefined') return false
  if (navigator.connection?.saveData) return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

let enginePromise = null
// Se carga recién cuando termina la pantalla de carga, para no trabarla.
export function getEngine() {
  if (!enginePromise) enginePromise = new Promise((res) => whenLoaded(res)).then(createEngine)
  return enginePromise
}

async function createEngine() {
  const THREE = await import('three')
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
  const SkeletonUtils = await import('three/examples/jsm/utils/SkeletonUtils.js')

  // El modelo está comprimido (meshopt + texturas WebP), pesa menos de 1 MB.
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL_URL)

  // Piel y ropa mates (el archivo viene brillante, tipo plástico).
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return
    o.frustumCulled = false
    const m = o.material
    if (!m) return
    if (m.map) m.map.anisotropy = 4
    if ('roughness' in m) {
      m.roughness = 0.82
      m.metalness = 0
      m.roughnessMap = null
      m.metalnessMap = null
      m.needsUpdate = true
    }
  })

  // Medidas: 1,75 de alto, pies en y = 0, centrado.
  gltf.scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(gltf.scene, true)
  const scale = 1.75 / box.getSize(new THREE.Vector3()).y
  const center = box.getCenter(new THREE.Vector3())
  const offset = new THREE.Vector3(-center.x * scale, -box.min.y * scale, -center.z * scale)
  const clip = gltf.animations[0] || null

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(1) // los píxeles los manejamos nosotros
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)
  let bufW = 1
  let bufH = 1

  const views = new Set()
  let raf = 0
  let last = performance.now()
  const loop = (now) => {
    raf = views.size ? requestAnimationFrame(loop) : 0
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    for (const v of views) v.frame(dt, now / 1000)
  }
  const kick = () => {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
  }

  function createView(canvas, optsRef) {
    const ctx = canvas.getContext('2d')
    const model = SkeletonUtils.clone(gltf.scene)
    model.scale.setScalar(scale)
    model.position.copy(offset)
    const root = new THREE.Group()
    root.add(model)
    const scene = new THREE.Scene()
    scene.add(root)
    // Luces: base suave, principal cálida y contraluz celeste (el acento de la página).
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1f2a, 1.6))
    const key = new THREE.DirectionalLight(0xfff1e0, 2.2)
    key.position.set(1.5, 2.5, 3)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x7cc4ff, 2.4)
    rim.position.set(-2.5, 2, -2.5)
    scene.add(rim)
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50)

    // Huesos y pose de reposo.
    const bones = {}
    const rest = new Map()
    model.traverse((o) => {
      if (!o.isBone) return
      bones[o.name] = o
      rest.set(o, o.quaternion.clone())
    })
    model.updateMatrixWorld(true)

    // Brazos más relajados: el modelo viene con los brazos abiertos (A-pose); los bajamos.
    const relaxed = new Map()
    const v1 = new THREE.Vector3()
    const v2 = new THREE.Vector3()
    for (const [arm, fore] of [['LeftArm', 'LeftForeArm'], ['RightArm', 'RightForeArm']]) {
      const a = bones[arm]
      const f = bones[fore]
      if (!a || !f) continue
      const d = f.getWorldPosition(v2).sub(a.getWorldPosition(v1)).normalize()
      const target = d.clone().lerp(new THREE.Vector3(0, -1, 0), 0.55).normalize()
      const qWorld = new THREE.Quaternion().setFromUnitVectors(d, target)
      const parentQ = a.parent.getWorldQuaternion(new THREE.Quaternion())
      const boneQ = a.getWorldQuaternion(new THREE.Quaternion())
      relaxed.set(a, parentQ.invert().multiply(qWorld).multiply(boneQ))
    }
    const toRest = () => {
      for (const [b, q] of rest) b.quaternion.copy(q)
      for (const [b, q] of relaxed) b.quaternion.copy(q)
    }
    toRest()

    // Saludo.
    const mixer = clip ? new THREE.AnimationMixer(model) : null
    const action = mixer ? mixer.clipAction(clip) : null
    if (action) {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = false
      mixer.addEventListener('finished', toRest)
    }

    const head = bones.Head
    const headRest = head ? head.quaternion.clone() : null
    const look = { x: 0, y: 0 }
    const drag = { on: false, x: 0, start: 0 }
    let spin = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '100px' })
    io.observe(canvas)
    const euler = new THREE.Euler()
    const qLook = new THREE.Quaternion()

    const view = {
      frame(dt, t) {
        const o = optsRef.current
        if (!visible || o.hidden) return
        const rect = canvas.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) return

        // Hacia dónde mira.
        let tx = 0
        let ty = 0
        if (o.lookAt) {
          tx = o.lookAt.x
          ty = o.lookAt.y
        } else if (pointer.active && !prefersReducedMotion) {
          tx = clamp((pointer.x - (rect.left + rect.width / 2)) / (window.innerWidth * 0.4))
          ty = clamp((pointer.y - (rect.top + rect.height * 0.25)) / (window.innerHeight * 0.5))
        }
        const k = prefersReducedMotion ? 1 : 0.08
        look.x += (tx - look.x) * k
        look.y += (ty - look.y) * k

        if (!drag.on) spin += (0 - spin) * 0.05
        root.rotation.y = spin + look.x * 0.35
        const talking = o.mood === 'talk' && !prefersReducedMotion
        root.position.y = talking ? Math.abs(Math.sin(t * 9)) * 0.012 : 0
        model.scale.y = scale * (prefersReducedMotion ? 1 : 1 + Math.sin(t * 1.7) * 0.004)

        const waving = action?.isRunning()
        if (waving) mixer.update(dt)
        else if (head && headRest) {
          const nod = talking ? Math.sin(t * 7) * 0.05 : 0
          euler.set(look.y * 0.25 + nod, look.x * 0.45, 0)
          head.quaternion.copy(headRest).multiply(qLook.setFromEuler(euler))
        }

        // Encuadre: cuerpo entero o de la cintura para arriba.
        const aspect = rect.width / rect.height
        const bust = o.framing === 'bust'
        const H = bust ? 0.95 : 1.98
        const cy = bust ? 1.33 : 0.93
        const needW = bust ? 0.8 : 0.95
        let dist = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        if (H * aspect < needW) dist *= needW / (H * aspect)
        camera.aspect = aspect
        camera.position.set(0, cy, dist)
        camera.lookAt(0, cy, 0)
        camera.updateProjectionMatrix()

        // Dibujar en el renderer compartido y copiar al canvas de este personaje.
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
        const pw = Math.round(rect.width * dpr)
        const ph = Math.round(rect.height * dpr)
        if (canvas.width !== pw || canvas.height !== ph) {
          canvas.width = pw
          canvas.height = ph
        }
        if (pw > bufW || ph > bufH) {
          bufW = Math.max(bufW, pw)
          bufH = Math.max(bufH, ph)
          renderer.setSize(bufW, bufH, false)
        }
        renderer.setViewport(0, 0, pw, ph)
        renderer.setScissor(0, 0, pw, ph)
        renderer.setScissorTest(true)
        renderer.clear()
        renderer.render(scene, camera)
        ctx.clearRect(0, 0, pw, ph)
        ctx.drawImage(renderer.domElement, 0, bufH - ph, pw, ph, 0, 0, pw, ph)
      },
      wave() {
        if (!action || prefersReducedMotion) return
        action.reset().fadeIn(0.2).play()
      },
      dragStart(x) {
        drag.on = true
        drag.x = x
        drag.start = spin
      },
      dragMove(x) {
        if (drag.on) spin = drag.start + (x - drag.x) * 0.01
      },
      dragEnd() {
        drag.on = false
      },
      dispose() {
        views.delete(view)
        io.disconnect()
        mixer?.stopAllAction()
      },
    }
    views.add(view)
    kick()
    return view
  }

  return { createView }
}
