export interface Provider {
  name: string;
  api_base_url: string;
  models: string[];
}

export interface Router {
  default: string;
  background: string;
  think: string;
  longContext: string;
  longContextThreshold: number;
  webSearch: string;
}

export interface Config {
  LOG_LEVEL: string;
  Providers: Provider[];
  Router: Router;
}
