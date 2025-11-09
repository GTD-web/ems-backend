"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreGeneratorUtil = void 0;
class ScoreGeneratorUtil {
    static generateNormalScore(min, max, mean, stdDev) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const score = mean + z * stdDev;
        return Math.max(min, Math.min(max, Math.round(score)));
    }
    static generateUniformScore(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static generateScore(config) {
        if (config.distribution === 'normal') {
            return this.generateNormalScore(config.min, config.max, config.mean || 80, config.stdDev || 10);
        }
        else {
            return this.generateUniformScore(config.min, config.max);
        }
    }
}
exports.ScoreGeneratorUtil = ScoreGeneratorUtil;
//# sourceMappingURL=score-generator.util.js.map