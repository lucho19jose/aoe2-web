import * as THREE from 'three'

export interface InputState {
  mousePosition: THREE.Vector2
  mouseDown: boolean
  rightMouseDown: boolean
  keys: Set<string>
  dragStart: THREE.Vector2 | null
  dragCurrent: THREE.Vector2 | null
}

export type InputCallback = (event: any) => void

/**
 * Handles all user input (mouse and keyboard)
 */
export class InputHandler {
  private canvas: HTMLCanvasElement
  private state: InputState
  private callbacks: Map<string, InputCallback[]>

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.state = {
      mousePosition: new THREE.Vector2(),
      mouseDown: false,
      rightMouseDown: false,
      keys: new Set(),
      dragStart: null,
      dragCurrent: null,
    }
    this.callbacks = new Map()

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this))
    this.canvas.addEventListener('wheel', this.onWheel.bind(this))

    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    window.addEventListener('keyup', this.onKeyUp.bind(this))

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  private onMouseDown(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.state.mousePosition.set(x, y)

    if (event.button === 0) {
      // Left click
      this.state.mouseDown = true
      this.state.dragStart = new THREE.Vector2(x, y)
      this.emit('leftclick', { position: this.state.mousePosition, event })
    } else if (event.button === 2) {
      // Right click
      this.state.rightMouseDown = true
      this.emit('rightclick', { position: this.state.mousePosition, event })
    }
  }

  private onMouseUp(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.state.mousePosition.set(x, y)

    if (event.button === 0) {
      this.state.mouseDown = false

      // Check if this was a drag or a click
      if (this.state.dragStart && this.state.dragCurrent) {
        const dragDistance = this.state.dragStart.distanceTo(this.state.dragCurrent)
        if (dragDistance > 0.05) {
          this.emit('dragend', {
            start: this.state.dragStart,
            end: this.state.dragCurrent,
          })
        }
      }

      this.state.dragStart = null
      this.state.dragCurrent = null
    } else if (event.button === 2) {
      this.state.rightMouseDown = false
    }
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.state.mousePosition.set(x, y)

    if (this.state.mouseDown && this.state.dragStart) {
      this.state.dragCurrent = new THREE.Vector2(x, y)
      this.emit('drag', {
        start: this.state.dragStart,
        current: this.state.dragCurrent,
      })
    }

    this.emit('mousemove', { position: this.state.mousePosition, event })
  }

  private onContextMenu(event: MouseEvent) {
    event.preventDefault()
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    this.emit('wheel', { delta: event.deltaY, event })
  }

  private onKeyDown(event: KeyboardEvent) {
    this.state.keys.add(event.key.toLowerCase())
    this.emit('keydown', { key: event.key, event })
  }

  private onKeyUp(event: KeyboardEvent) {
    this.state.keys.delete(event.key.toLowerCase())
    this.emit('keyup', { key: event.key, event })
  }

  public on(event: string, callback: InputCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  public off(event: string, callback: InputCallback) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  public isKeyPressed(key: string): boolean {
    return this.state.keys.has(key.toLowerCase())
  }

  public getMousePosition(): THREE.Vector2 {
    return this.state.mousePosition.clone()
  }

  public isDragging(): boolean {
    return this.state.mouseDown && this.state.dragStart !== null
  }

  public getDragBox(): { start: THREE.Vector2; end: THREE.Vector2 } | null {
    if (this.state.dragStart && this.state.dragCurrent) {
      return {
        start: this.state.dragStart,
        end: this.state.dragCurrent,
      }
    }
    return null
  }

  public dispose() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.removeEventListener('contextmenu', this.onContextMenu.bind(this))
    this.canvas.removeEventListener('wheel', this.onWheel.bind(this))

    window.removeEventListener('keydown', this.onKeyDown.bind(this))
    window.removeEventListener('keyup', this.onKeyUp.bind(this))

    this.callbacks.clear()
  }
}
