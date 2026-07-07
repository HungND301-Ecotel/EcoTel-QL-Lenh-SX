export interface Employee {
  id: string;
  code: string;
  name: string;
  team: string;
  role: string;
  avatarUrl: string | null;
}

export interface DailyRecord {
  date: string;
  dayNum: number;
  dayOfWeek: "CN" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7";
  status: "working" | "absent" | "late" | "short" | "future";
  checkIn: string;
  checkOut: string;
}
