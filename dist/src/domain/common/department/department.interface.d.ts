export interface IDepartment {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly order: number;
    readonly managerId?: string;
    readonly parentDepartmentId?: string;
    readonly externalId: string;
    readonly externalCreatedAt: Date;
    readonly externalUpdatedAt: Date;
    readonly lastSyncAt?: Date;
}
