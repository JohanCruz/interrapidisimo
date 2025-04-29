export interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  teacher?: {
    id: number;
    totalSubjects: number;
    department: string | null;
    salary: number | null;
    user: {
      id: number;
      name: string;
    };
  };
  students?: {
    id: number;
    name: string;
    email: string;
  }[];
}
