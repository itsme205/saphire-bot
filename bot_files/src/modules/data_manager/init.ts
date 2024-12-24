import { DataManager } from './Manager'
import path from 'path'

// globalDataManager: DataManagerClass
global.dataManager = new DataManager(path.join(process.cwd(), '/data/data.json')) // You can set your own path

export default {
  id: 'data',
  init: async (log: (text: string) => any) => {
    await global.dataManager.init()
    log('Successfully initialized!')
  }
}
