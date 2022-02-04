declare namespace NodeJS {
  export interface ProcessEnv {
    LOG_LEVEL: string;
    ENV: string;
    REGION: string;
    TRACING: boolean;
    EXCHANGES_SECRET_NAME: string;
    AVAILABLE_SYMBOLS: string;
    CANDLESTICK_TABLE_NAME: string;
    STRATEGY_TABLE_NAME: string;
    ORDER_TABLE_NAME: string;
    UPDATED_CANDLESTICKS_QUEUE_URL: string;
    ACTIVE_STRATEGIES_QUEUE_URL: string;
    PROCESSED_STRATEGY_STEP_QUEUE_URL: string;
  }
}
