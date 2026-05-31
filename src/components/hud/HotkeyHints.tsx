// =============================================================================
// HOTKEY HINTS - Keyboard shortcuts display (mode-aware)
// =============================================================================

import { useGameStore } from '../../store/useGameStore'
import {
  hotkeyHintsContainerStyle,
  hotkeyHintStyle,
  hotkeyKbdStyle,
  hotkeyTextStyle,
} from './styles'

export default function HotkeyHints() {
  const operationMode = useGameStore((s) => s.operationMode)

  if (operationMode === 'tugboat') {
    return (
      <div style={hotkeyHintsContainerStyle}>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>WASD</kbd>
          <span style={hotkeyTextStyle}>Propulsion + Steer</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>SPACE</kbd>
          <span style={hotkeyTextStyle}>Emergency Stop</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>SHIFT</kbd>
          <span style={hotkeyTextStyle}>Boost</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>T</kbd>
          <span style={hotkeyTextStyle}>Tow Line</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>RMB</kbd>
          <span style={hotkeyTextStyle}>Look</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>Q</kbd>
          <span style={hotkeyTextStyle}>Crane Mode</span>
        </div>
      </div>
    )
  }

  if (operationMode === 'walking') {
    return (
      <div style={hotkeyHintsContainerStyle}>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>WASD</kbd>
          <span style={hotkeyTextStyle}>Walk</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>SHIFT</kbd>
          <span style={hotkeyTextStyle}>Sprint</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>SPACE</kbd>
          <span style={hotkeyTextStyle}>Jump</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>F</kbd>
          <span style={hotkeyTextStyle}>Enter Cab</span>
        </div>
        <div style={hotkeyHintStyle}>
          <kbd style={hotkeyKbdStyle}>CLICK</kbd>
          <span style={hotkeyTextStyle}>Lock Mouse</span>
        </div>
      </div>
    )
  }

  return (
    <div style={hotkeyHintsContainerStyle}>
      <div style={hotkeyHintStyle}>
        <kbd style={hotkeyKbdStyle}>TAB</kbd>
        <span style={hotkeyTextStyle}>Toggle Monitor</span>
      </div>
      <div style={hotkeyHintStyle}>
        <kbd style={hotkeyKbdStyle}>E</kbd>
        <span style={hotkeyTextStyle}>Twistlock</span>
      </div>
      <div style={hotkeyHintStyle}>
        <kbd style={hotkeyKbdStyle}>WASD</kbd>
        <span style={hotkeyTextStyle}>Move</span>
      </div>
    </div>
  )
}
