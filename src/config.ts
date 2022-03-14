import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

interface IConfig {
  host: string
  port: number
  serverHost: string
  serverPort: number
}

export const config: IConfig = parse(
  readFileSync(resolve(process.cwd(), 'config.yml'), 'utf8')
)
