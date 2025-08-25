import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { Config } from '../types/config';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: Config | null = null;

  private constructor() { }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public loadConfig(configPath?: string): Config {
    if (this.config) {
      return this.config;
    }

    const defaultConfigPath = path.join(__dirname, '../../config/config-dev.yaml');
    const finalConfigPath = configPath || defaultConfigPath;

    try {
      const fileContents = fs.readFileSync(finalConfigPath, 'utf8');
      this.config = yaml.load(fileContents) as Config;

      if (!this.config) {
        throw new Error('Failed to parse config file');
      }

      return this.config;
    } catch (error) {
      console.error('Error loading config:', error);
      throw new Error(`Failed to load config from ${finalConfigPath}`);
    }
  }

  public getConfig(): Config {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  public getProvider(providerName: string) {
    const config = this.getConfig();
    return config.Providers.find(provider => provider.name === providerName);
  }

  public getDefaultProvider() {
    const config = this.getConfig();
    const [providerName] = config.Router.default.split(',');
    return this.getProvider(providerName);
  }
}
