import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private minimapCanvas: HTMLCanvasElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private animationFrameId: number | null = null
  private isRunning = false

  // Game entities
  private terrain: THREE.Mesh | null = null
  private units: THREE.Object3D[] = []

  constructor(canvas: HTMLCanvasElement, minimapCanvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.minimapCanvas = minimapCanvas

    // Initialize Three.js scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(20, 30, 20)
    this.camera.lookAt(0, 0, 0)

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI / 2.5
    this.controls.minDistance = 10
    this.controls.maxDistance = 100

    // Initialize scene
    this.initScene()

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  private initScene() {
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(directionalLight)

    // Create terrain
    const terrainGeometry = new THREE.PlaneGeometry(100, 100, 50, 50)
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a7d3a,
      roughness: 0.8,
      metalness: 0.2
    })
    this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
    this.terrain.rotation.x = -Math.PI / 2
    this.terrain.receiveShadow = true
    this.scene.add(this.terrain)

    // Add some test units
    this.createTestUnit(0, 0, 0)
    this.createTestUnit(5, 0, 5)
    this.createTestUnit(-5, 0, -5)

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222)
    this.scene.add(gridHelper)
  }

  private createTestUnit(x: number, y: number, z: number) {
    const geometry = new THREE.BoxGeometry(1, 2, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const unit = new THREE.Mesh(geometry, material)
    unit.position.set(x, y + 1, z)
    unit.castShadow = true
    unit.receiveShadow = true
    this.scene.add(unit)
    this.units.push(unit)
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private animate() {
    if (!this.isRunning) return

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))

    // Update controls
    this.controls.update()

    // Render scene
    this.renderer.render(this.scene, this.camera)

    // Update minimap (simplified)
    this.updateMinimap()
  }

  private updateMinimap() {
    const ctx = this.minimapCanvas.getContext('2d')
    if (!ctx) return

    // Clear minimap
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(0, 0, 200, 200)

    // Draw terrain bounds
    ctx.strokeStyle = '#4a4a4a'
    ctx.strokeRect(10, 10, 180, 180)

    // Draw units as dots
    ctx.fillStyle = '#ff0000'
    this.units.forEach(unit => {
      const x = ((unit.position.x + 50) / 100) * 180 + 10
      const z = ((unit.position.z + 50) / 100) * 180 + 10
      ctx.beginPath()
      ctx.arc(x, z, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw camera position
    const camX = ((this.camera.position.x + 50) / 100) * 180 + 10
    const camZ = ((this.camera.position.z + 50) / 100) * 180 + 10
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(camX, camZ, 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  public start() {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  public stop() {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public dispose() {
    this.stop()
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.controls.dispose()
    this.renderer.dispose()
  }
}
