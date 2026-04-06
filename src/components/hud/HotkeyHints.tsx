// =============================================================================
// HOTKEY HINTS - Keyboard shortcuts display
// =============================================================================

import {
  hotkeyHintsContainerStyle,
  hotkeyHintStyle,
  hotkeyKbdStyle,
  hotkeyTextStyle,
} from './styles'

export default function HotkeyHints() {
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
