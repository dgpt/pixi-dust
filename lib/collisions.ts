import { Events as MatterEvents, type Engine, type IEventCollision } from 'matter-js'
import type { Entity } from './Entity'
import { getLayerListeners } from './layers'
import { Events, emit } from './events'

export const initCollisions = (engine: Engine): () => void => {
  // Listen for collision events from Matter.js
  MatterEvents.on(engine, 'collisionStart', (event: IEventCollision<Engine>) => {
    event.pairs.forEach(pair => {
      const entityA = pair.bodyA.plugin?.entity as Entity | undefined
      const entityB = pair.bodyB.plugin?.entity as Entity | undefined

      if (!entityA || !entityB) return

      // Emit collision event first
      emit<Events.collision>(Events.collision, { a: entityA, b: entityB })

      // Get all registered layer listeners
      const layerListeners = getLayerListeners() as Map<string, Set<Entity>>

      // Only check layers that have registered listeners
      layerListeners.forEach((listeners, layer) => {
        // Only emit if there are listeners and at least one entity is in this layer
        if (listeners.size > 0 && (entityA.layers.has(layer) || entityB.layers.has(layer))) {
          emit(layer, { a: entityA, b: entityB })
        }
      })
    })
  })

  // Return cleanup function
  return () => {
    MatterEvents.off(engine, 'collisionStart')
  }
}