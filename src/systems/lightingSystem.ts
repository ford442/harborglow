import { ShipType } from '../store/useGameStore'

// =============================================================================
// LIGHTING SYSTEM - HarborGlow PBR Edition
// Manages harbor-wide light shows and weather-reactive lighting
// =============================================================================

export interface LightShowState {
  isActive: boolean
  shipId: string | null
  shipType: ShipType | null
  startTime: number
  duration: number
}

class LightingSystem {
  private currentShow: LightShowState = {
    isActive: false,
    shipId: null,
    shipType: null,
    startTime: 0,
    duration: 30000 // 30 seconds
  }
  
  private intensityMultiplier: number = 1.0
  private beatPulse: number = 0

  // ============================================================================
  // HARBOR LIGHT SHOW - Triggered on v2.0 upgrade
  // ============================================================================
  startHarborShow(shipId: string, shipType: ShipType) {
    this.currentShow = {
      isActive: true,
      shipId,
      shipType,
      startTime: Date.now(),
      duration: 30000
    }
    
    console.log('🎆 HARBOR LIGHT SHOW ACTIVATED!')
    console.log(`   Ship: ${shipId} (${shipType})`)
    console.log('   Duration: 30 seconds')
    console.log('   All LEDs, funnels, deck lights PULSING to beat!')
    
    setTimeout(() => {
      this.endHarborShow()
    }, this.currentShow.duration)
  }

  endHarborShow() {
    if (this.currentShow.isActive) {
      console.log('🎆 Harbor light show complete!')
      this.currentShow.isActive = false
      this.currentShow.shipId = null
      this.currentShow.shipType = null
    }
  }

  // ============================================================================
  // UPDATE - Call in useFrame
  // ============================================================================
  update(time: number, bpm: number) {
    if (this.currentShow.isActive) {
      const elapsed = Date.now() - this.currentShow.startTime
      const progress = elapsed / this.currentShow.duration
      
      const beatDuration = 60 / bpm
      this.beatPulse = (Math.sin(time * (Math.PI * 2 / beatDuration)) + 1) / 2
      
      if (progress < 0.2) {
        this.intensityMultiplier = 1.0 + progress * 5
      } else if (progress > 0.8) {
        this.intensityMultiplier = 1.0 + (1 - progress) * 5
      } else {
        this.intensityMultiplier = 2.0
      }
    } else {
      this.intensityMultiplier = 1.0
      this.beatPulse = 0
    }
  }

  // ============================================================================
  // GETTERS for ship components
  // ============================================================================
  getLightIntensity(baseIntensity: number): number {
    if (!this.currentShow.isActive) return baseIntensity
    return baseIntensity * this.intensityMultiplier * (1 + this.beatPulse * 0.5)
  }

  getEmissiveColor(baseColor: string, shipId: string): string {
    if (!this.currentShow.isActive || this.currentShow.shipId !== shipId) {
      return baseColor
    }
    
    const hue = (Date.now() / 1000 * 60) % 360
    return `hsl(${hue}, 100%, 60%)`
  }

  isShowActive(): boolean {
    return this.currentShow.isActive
  }

  getCurrentShow(): LightShowState {
    return this.currentShow
  }

  getBeatPulse(): number {
    return this.beatPulse
  }

  // ============================================================================
  // CLIMAX TRIGGER - Called from musicSystem
  // ============================================================================
  triggerClimax(shipType: ShipType) {
    console.log(`🎵 CLIMAX SEQUENCE for ${shipType}!`)
    
    const originalMultiplier = this.intensityMultiplier
    this.intensityMultiplier = 3.0
    
    setTimeout(() => {
      this.intensityMultiplier = originalMultiplier
    }, 500)
  }

  // ============================================================================
  // WEATHER LIGHTING - Get lighting config based on weather
  // ============================================================================
  getWeatherLighting(weather: string) {
    switch (weather) {
      case 'storm':
        return {
          sunIntensity: 0.2,
          sunColor: '#444466',
          ambientIntensity: 0.15,
          ambientColor: '#1a1a2e',
          sideLightIntensity: 1.5,
          dramatic: true
        }
      case 'rain':
        return {
          sunIntensity: 0.4,
          sunColor: '#666688',
          ambientIntensity: 0.3,
          ambientColor: '#2a2a3e',
          sideLightIntensity: 0.8,
          dramatic: false
        }
      case 'fog':
        return {
          sunIntensity: 0.6,
          sunColor: '#8888aa',
          ambientIntensity: 0.4,
          ambientColor: '#3a3a4e',
          sideLightIntensity: 0.5,
          dramatic: false
        }
      default: // clear
        return {
          sunIntensity: 1.2,
          sunColor: '#fff8e7',
          ambientIntensity: 0.6,
          ambientColor: '#ffffff',
          sideLightIntensity: 0.5,
          dramatic: false
        }
    }
  }
}

export const lightingSystem = new LightingSystem()
