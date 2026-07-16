import { Message } from '../../lib/grok'

export class ConversationMemory {
  /**
   * Reconstructs the context/filters from the recent conversation history.
   * Enables the assistant to remember filters (e.g. "Only kitchen") across turns.
   */
  public extractContext(history: Message[]): string {
    if (!history || history.length === 0) return ''

    let activeTable = ''
    let activeRoom = ''
    let activeAppliance = ''

    // Traverse history to extract context clues
    for (const msg of history) {
      const text = msg.content.toLowerCase()
      
      // Table scope detection
      if (text.includes('energylog') || text.includes('energy log') || text.includes('telemetry')) {
        activeTable = 'EnergyLog'
      } else if (text.includes('appliance') || text.includes('device')) {
        activeTable = 'Appliance'
      } else if (text.includes('room')) {
        activeTable = 'Room'
      }

      // Room scope detection
      if (text.includes('kitchen') || text.includes('cocina') || text.includes('रसोई')) {
        activeRoom = 'Kitchen'
      } else if (text.includes('living room') || text.includes('sala')) {
        activeRoom = 'Living Room'
      } else if (text.includes('bedroom')) {
        activeRoom = 'Bedroom'
      }

      // Appliance scope detection
      if (text.includes('ac') || text.includes('air conditioner')) {
        activeAppliance = 'Air Conditioner'
      } else if (text.includes('refrigerator') || text.includes('fridge')) {
        activeAppliance = 'Refrigerator'
      }
    }

    let contextSummary = ''
    if (activeTable) contextSummary += `- Active Table Context: "${activeTable}"\n`
    if (activeRoom) contextSummary += `- Active Room Filter Context: "${activeRoom}"\n`
    if (activeAppliance) contextSummary += `- Active Appliance Filter Context: "${activeAppliance}"\n`

    return contextSummary
  }
}
