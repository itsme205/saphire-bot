import fs from 'fs'

export class DataManager {
  private readonly data_path: string | undefined
  private saved_data: Map<string, any>
  constructor(dataPath: string) {
    if (!fs.existsSync(dataPath)) {
      console.log(`Cannot find data file by way "${dataPath}"! Trying to create...`)

      try {
        fs.writeFileSync(dataPath, '{}')
      } catch (err) {
        console.log(err)
      }
    }

    this.data_path = dataPath
    this.saved_data = new Map()
    this.isReady = false
  }

  /**
     * Check if data can be parsed through "JSON.parse"
     * @param data Data to check.
     * @returns
     */
  private isParseable(data: string): boolean {
    try {
      JSON.parse(data)
    } catch {
      return false
    }
    return true
  }

  /**
     * Checking if DataManager is ready.
     * @returns {boolean}
     */
  public isReady: boolean

  /**
     * Get data file prepared. You've to run this function first before using anothers.
     * @returns Nothing
     */
  public async init(): Promise<Map<string, any> | undefined> {
    if (!this.data_path || !fs.existsSync(this.data_path)) { return }

    let fileContent: string = (await fs.promises.readFile(this.data_path)).toString() ?? ''
    if (!this.isParseable(fileContent)) {
      fileContent = '[]'
      await fs.promises.writeFile(this.data_path, '[]')
    }

    try {
      this.saved_data = new Map(JSON.parse(fileContent ?? '[]'))
    } catch {
      await fs.promises.writeFile(this.data_path ?? '', '[]')
      this.saved_data = new Map()
    }

    this.isReady = true
  }

  /**
     * Overwrites key
     * @param key Key name
     * @param data Key value
     * @returns Promise returns current data as "Map" class.
     */
  public async writeKey(key: string, data: any): Promise<Map<string, any>> {
    if (!this.data_path) throw new Error('Cannot get data path.')

    this.saved_data.set(key, data)

    await fs.promises.writeFile(this.data_path, JSON.stringify(
      Array.from(this.saved_data.entries())
      , null, 1))

    return this.saved_data
  }

  /**
     * Gets key.
     * @param key Key name
     * @returns Key value
     */
  public getKey(key: string): any {
    return this.saved_data.get(key)
  }
}

export default DataManager
