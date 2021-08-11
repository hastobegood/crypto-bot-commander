declare namespace NodeJS {
  export interface ProcessEnv {
    ENV: string;
    REGION: string;
    BINANCE_URL: string;
    BINANCE_SECRET_NAME: string;
    TRADING_TABLE_NAME: string;
    DCA_TRADING_CONFIG: string;
    BOT_TRADING_CONFIG: string;
  }
}
