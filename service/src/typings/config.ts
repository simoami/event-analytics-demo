export interface IConfig {
  host: string
  port: number
  restApiRoot: string
  services: IConfigServices
}

export interface IConfigRedisService {
  host: string
  port: number
  password?: string
  timeout?: number
  debug?: boolean
}


export interface IConfigServices {
  redis: IConfigRedisService
}