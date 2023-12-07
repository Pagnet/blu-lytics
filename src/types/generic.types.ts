export interface DataContainer {
  data: Record<string, any> | null;
}

export interface Flagable {
  enable: boolean;
}

export interface FunctionContainer {
  functionValue: (...args: any[]) => any | null;
}

export interface Identifiable {
  name: string;
}

export interface Recognizable {
  user: UserBluefin | null;
}

export interface UserBluefin {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
}

export type ScreenType = string;
