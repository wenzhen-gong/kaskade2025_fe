// Benchmark run result.
export interface Result {
  avgTimeMs: number;
  success: number;
  failures: number;
  percentileTimeMs: Record<number, number>;
}

// Result plus some metadata
export interface ResultMetadata {
  id: number;
  userId: string;
  timestamp: string;
  sessionId: string;
  version: string;
  successRatio: number;
  p50Latency: number;
  p95Latency: number;
  throughput: number;
}

// TODO(jingjing): Clean up later.
export interface PercentileStats {
  average: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
  total: number;
  p0_001: number;
  p0_01: number;
  p0_1: number;
  p1: number;
  p2_5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p97_5: number;
  p99: number;
  p99_9: number;
  p99_99: number;
  p99_999: number;
}

// TODO(jingjing): Clean up later.
export interface LatencyStats {
  [requestName: string]: PercentileStats;
}

// TODO(jingjing): Clean up later.
export interface ThroughputStats {
  [requestName: string]: PercentileStats;
}

// TODO(jingjing): Clean up later.
export interface LegacyResult {
  latencyStats: LatencyStats;
  requestThroughputStats: ThroughputStats | PercentileStats;
  byteThroughputStats: ThroughputStats | PercentileStats;
  averagRequestThroughput: number;
  averageByteThroughput: number;
}

export interface History {
  timestamp: number;
  testDuration: number;
  concurrentUsers: number;
  targetThroughput: number;
  numOfWorkers: number;
  result: LegacyResult;
}

export interface Request {
  requestId: number;
  requestName: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  reqBody?: string;
  headers?: Header[];
  params?: Param[];
  contentType?: string | null;
}

export interface Session {
  sessionId: number;
  sessionName: string;
  overview: string;
  createdBy: string;
  createdOn: number;
  lastModified: number;
  servers: string[];
  requests: Request[];
  history: History[];
}

// RunTab相关的类型定义
export interface RunTabConfig {
  URL?: string;
  testDuration?: number;
  concurrencyNumber?: number;
  totalRequests?: number;
  [key: string]: string | number | undefined;
}

export interface Header {
  key: string;
  value: string;
}

export interface Param {
  key: string;
  value: string;
}
export interface SignupFormData {
  username: string;
  email: string;
  password: string;
}

export interface SigninFormData {
  username: string;
  password: string;
}

export interface ValidUserInput {
  valid: boolean;
  flag: boolean;
  error: string | null;
}
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface State {
  datafile: Session[];
  configFile?: Session;
  runTabConfig: RunTabConfig;
  validUserInput: ValidUserInput;
  result?: Result;
  signupError: string | null;
  openSignup: boolean;
  signupLoading: boolean;
  signupFormData: SignupFormData;

  signinError: string | null;
  openSignin: boolean;
  signinLoading: boolean;
  signinFormData: SigninFormData;

  user: User | null;

  openProfile: boolean;
  resultMetadata?: ResultMetadata;
}
