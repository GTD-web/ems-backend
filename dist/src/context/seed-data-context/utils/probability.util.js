"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbabilityUtil = void 0;
class ProbabilityUtil {
    static selectByProbability(distribution) {
        const random = Math.random();
        let cumulative = 0;
        for (const [key, probability] of Object.entries(distribution)) {
            cumulative += probability;
            if (random < cumulative) {
                return key;
            }
        }
        return Object.keys(distribution)[0];
    }
    static validateDistribution(distribution) {
        const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 0.001) {
            throw new Error(`분포 비율의 합이 1.0이 아닙니다: ${sum}`);
        }
    }
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static rollDice(probability) {
        return Math.random() < probability;
    }
}
exports.ProbabilityUtil = ProbabilityUtil;
//# sourceMappingURL=probability.util.js.map