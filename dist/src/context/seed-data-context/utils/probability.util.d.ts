export declare class ProbabilityUtil {
    static selectByProbability<T extends Record<string, number>>(distribution: T): keyof T;
    static validateDistribution(distribution: Record<string, number>): void;
    static randomInt(min: number, max: number): number;
    static rollDice(probability: number): boolean;
}
