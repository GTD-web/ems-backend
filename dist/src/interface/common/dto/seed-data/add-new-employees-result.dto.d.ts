export declare class AddNewEmployeesResultDto {
    success: boolean;
    message: string;
    addedCount: number;
    failedCount: number;
    batchNumber: string;
    errors?: string[];
    addedEmployeeIds: string[];
}
