export declare class ScoreGeneratorUtil {
    static generateNormalScore(min: number, max: number, mean: number, stdDev: number): number;
    static generateUniformScore(min: number, max: number): number;
    static generateScore(config: {
        min: number;
        max: number;
        distribution: 'normal' | 'uniform';
        mean?: number;
        stdDev?: number;
    }): number;
}
