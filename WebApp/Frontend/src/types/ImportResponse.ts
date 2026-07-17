export interface ImportResponse {
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  deletedCount: number;
  invalidCount: number;
  invalidRows: {
    row: any;
    error: string;
  }[];
}
