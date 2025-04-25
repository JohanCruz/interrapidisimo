export interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  teacher?: {
    id: number;
    name: string;
  };
  students?: {
    id: number;
    name: string;
    email: string;
  }[];
}
