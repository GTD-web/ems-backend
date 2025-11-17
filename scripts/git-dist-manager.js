const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        return fileList;
    }

    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function getRelativePath(filePath) {
    const rootDir = path.join(__dirname, '..');
    return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

function executeGitCommand(command, description) {
    try {
        execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        console.log(`✅ ${description}`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} 실패:`, error.message);
        return false;
    }
}

function ignoreDist() {
    console.log('📦 dist 폴더 변경사항 무시 설정 중...\n');

    if (!fs.existsSync(DIST_DIR)) {
        console.log('⚠️  dist 폴더가 존재하지 않습니다. 먼저 빌드를 실행하세요.');
        return;
    }

    console.log('📂 dist 폴더 파일 목록 수집 중...');
    const files = getAllFiles(DIST_DIR);

    if (files.length === 0) {
        console.log('⚠️  dist 폴더가 비어있습니다.');
        return;
    }

    console.log(`📋 총 ${files.length}개 파일 발견\n`);

    // Git에 추적되고 있는 파일만 필터링
    const rootDir = path.join(__dirname, '..');
    const trackedFiles = [];

    try {
        const gitFiles = execSync(
            'git ls-files',
            { encoding: 'utf-8', cwd: rootDir, stdio: 'pipe' }
        ).split('\n').map(f => f.trim()).filter(f => f.startsWith('dist/'));

        const relativeFiles = files.map(f => getRelativePath(f));
        trackedFiles.push(...relativeFiles.filter(f => gitFiles.includes(f)));
    } catch (error) {
        console.log('⚠️  Git 추적 파일 목록을 가져오는 중 오류 발생, 모든 파일 처리 시도...');
        trackedFiles.push(...files.map(f => getRelativePath(f)));
    }

    if (trackedFiles.length === 0) {
        console.log('ℹ️  Git에 추적되고 있는 dist 파일이 없습니다.');
        console.log('💡 먼저 "git add dist"로 파일을 추가한 후 다시 시도하세요.');
        return;
    }

    console.log(`🔄 ${trackedFiles.length}개 파일 처리 중...\n`);

    let successCount = 0;
    let failCount = 0;
    const BATCH_SIZE = 50; // 배치 크기

    // 배치 처리로 성능 개선
    for (let i = 0; i < trackedFiles.length; i += BATCH_SIZE) {
        const batch = trackedFiles.slice(i, i + BATCH_SIZE);
        const progress = Math.min(i + BATCH_SIZE, trackedFiles.length);

        // 진행 상황 표시
        process.stdout.write(`\r⏳ 진행 중... ${progress}/${trackedFiles.length} (${Math.round((progress / trackedFiles.length) * 100)}%)`);

        // 배치로 한 번에 처리
        const fileArgs = batch.map(f => `"${f}"`).join(' ');
        const command = `git update-index --skip-worktree ${fileArgs}`;

        try {
            execSync(command, {
                stdio: 'pipe',
                cwd: rootDir,
                shell: true
            });
            successCount += batch.length;
        } catch (error) {
            // 배치 실패 시 개별 처리
            batch.forEach((relativePath) => {
                try {
                    execSync(`git update-index --skip-worktree "${relativePath}"`, {
                        stdio: 'pipe',
                        cwd: rootDir,
                        shell: true
                    });
                    successCount++;
                } catch (err) {
                    failCount++;
                }
            });
        }
    }

    console.log(`\r✅ 완료: ${successCount}개 파일 설정 완료`);
    if (failCount > 0) {
        console.log(`⚠️  ${failCount}개 파일 설정 실패 (이미 skip-worktree로 설정된 파일일 수 있음)`);
    }
    console.log('\n💡 이제 dist 폴더의 변경사항은 Git에서 무시됩니다.');
    console.log('💡 커밋하려면 "npm run dist:track"을 먼저 실행하세요.');
}

function trackDist() {
    console.log('📦 dist 폴더 추적 재개 설정 중...\n');

    if (!fs.existsSync(DIST_DIR)) {
        console.log('⚠️  dist 폴더가 존재하지 않습니다.');
        return;
    }

    const rootDir = path.join(__dirname, '..');

    // skip-worktree로 설정된 파일만 찾기
    let skippedFiles = [];
    try {
        const result = execSync(
            'git ls-files -v',
            { encoding: 'utf-8', cwd: rootDir, stdio: 'pipe' }
        );

        skippedFiles = result
            .split('\n')
            .filter(line => line.trim().startsWith('S ') && line.includes('dist/'))
            .map(line => line.replace(/^S\s+/, '').trim());
    } catch (error) {
        console.log('⚠️  Git 파일 목록을 가져오는 중 오류 발생');
        return;
    }

    if (skippedFiles.length === 0) {
        console.log('ℹ️  skip-worktree로 설정된 dist 파일이 없습니다.');
        return;
    }

    console.log(`📋 ${skippedFiles.length}개 파일 발견\n`);
    console.log(`🔄 처리 중...\n`);

    let successCount = 0;
    let failCount = 0;
    const BATCH_SIZE = 50;

    // 배치 처리
    for (let i = 0; i < skippedFiles.length; i += BATCH_SIZE) {
        const batch = skippedFiles.slice(i, i + BATCH_SIZE);
        const progress = Math.min(i + BATCH_SIZE, skippedFiles.length);

        process.stdout.write(`\r⏳ 진행 중... ${progress}/${skippedFiles.length} (${Math.round((progress / skippedFiles.length) * 100)}%)`);

        const fileArgs = batch.map(f => `"${f}"`).join(' ');
        const command = `git update-index --no-skip-worktree ${fileArgs}`;

        try {
            execSync(command, {
                stdio: 'pipe',
                cwd: rootDir,
                shell: true
            });
            successCount += batch.length;
        } catch (error) {
            // 배치 실패 시 개별 처리
            batch.forEach((relativePath) => {
                try {
                    execSync(`git update-index --no-skip-worktree "${relativePath}"`, {
                        stdio: 'pipe',
                        cwd: rootDir,
                        shell: true
                    });
                    successCount++;
                } catch (err) {
                    failCount++;
                }
            });
        }
    }

    console.log(`\r✅ 완료: ${successCount}개 파일 추적 재개`);
    if (failCount > 0) {
        console.log(`⚠️  ${failCount}개 파일 처리 실패`);
    }
    console.log('\n💡 이제 dist 폴더의 변경사항이 Git에서 추적됩니다.');
    console.log('💡 커밋 후 "npm run dist:ignore"를 실행하여 다시 무시하도록 설정하세요.');
}

function statusDist() {
    console.log('📊 dist 폴더 Git 추적 상태 확인 중...\n');

    if (!fs.existsSync(DIST_DIR)) {
        console.log('⚠️  dist 폴더가 존재하지 않습니다.');
        return;
    }

    try {
        const result = execSync(
            'git ls-files -v | grep "^S"',
            { encoding: 'utf-8', cwd: path.join(__dirname, '..'), stdio: 'pipe' }
        );

        const skippedFiles = result
            .split('\n')
            .filter(line => line.trim() && line.includes('dist/'))
            .map(line => line.replace(/^S\s+/, ''));

        if (skippedFiles.length > 0) {
            console.log(`✅ ${skippedFiles.length}개 파일이 skip-worktree로 설정되어 있습니다:\n`);
            skippedFiles.slice(0, 10).forEach(file => console.log(`   - ${file}`));
            if (skippedFiles.length > 10) {
                console.log(`   ... 외 ${skippedFiles.length - 10}개 파일`);
            }
        } else {
            console.log('ℹ️  skip-worktree로 설정된 dist 파일이 없습니다.');
            console.log('   (모든 파일이 정상적으로 추적되고 있습니다)');
        }
    } catch (error) {
        console.log('ℹ️  skip-worktree로 설정된 파일이 없습니다.');
    }
}

function buildAndStage() {
    const rootDir = path.join(__dirname, '..');

    console.log('🚀 빌드 및 Git 스테이징 자동화 시작...\n');

    // 1. dist 추적 해제 (skip-worktree 해제)
    console.log('1️⃣  dist 폴더 추적 해제 중...');
    const rootDirForTrack = path.join(__dirname, '..');

    let skippedFiles = [];
    try {
        const result = execSync(
            'git ls-files -v',
            { encoding: 'utf-8', cwd: rootDirForTrack, stdio: 'pipe' }
        );

        skippedFiles = result
            .split('\n')
            .filter(line => line.trim().startsWith('S ') && line.includes('dist/'))
            .map(line => line.replace(/^S\s+/, '').trim());
    } catch (error) {
        // skip-worktree로 설정된 파일이 없으면 넘어감
    }

    if (skippedFiles.length > 0) {
        console.log(`   ${skippedFiles.length}개 파일의 skip-worktree 해제 중...`);
        const BATCH_SIZE = 50;

        for (let i = 0; i < skippedFiles.length; i += BATCH_SIZE) {
            const batch = skippedFiles.slice(i, i + BATCH_SIZE);
            const fileArgs = batch.map(f => `"${f}"`).join(' ');
            const command = `git update-index --no-skip-worktree ${fileArgs}`;

            try {
                execSync(command, {
                    stdio: 'pipe',
                    cwd: rootDirForTrack,
                    shell: true
                });
            } catch (error) {
                // 개별 처리
                batch.forEach((relativePath) => {
                    try {
                        execSync(`git update-index --no-skip-worktree "${relativePath}"`, {
                            stdio: 'pipe',
                            cwd: rootDirForTrack,
                            shell: true
                        });
                    } catch (err) {
                        // 무시
                    }
                });
            }
        }
        console.log('   ✅ 추적 해제 완료\n');
    } else {
        console.log('   ℹ️  skip-worktree로 설정된 파일이 없습니다.\n');
    }

    // 2. 기존 dist 폴더 삭제
    console.log('2️⃣  기존 dist 폴더 삭제 중...');
    try {
        if (fs.existsSync(DIST_DIR)) {
            execSync('rm -rf dist', {
                stdio: 'pipe',
                cwd: rootDir,
                shell: true
            });
            console.log('   ✅ dist 폴더 삭제 완료\n');
        } else {
            console.log('   ℹ️  dist 폴더가 존재하지 않습니다.\n');
        }
    } catch (error) {
        console.error('   ⚠️  dist 폴더 삭제 실패:', error.message);
        console.log('   계속 진행합니다...\n');
    }

    // 3. 빌드 실행
    console.log('3️⃣  프로젝트 빌드 중...');
    try {
        execSync('npm run build', {
            stdio: 'inherit',
            cwd: rootDir
        });
        console.log('   ✅ 빌드 완료\n');
    } catch (error) {
        console.error('   ❌ 빌드 실패');
        process.exit(1);
    }

    // 4. dist 폴더의 모든 파일을 stage에 추가
    console.log('4️⃣  dist 폴더 파일들을 Git stage에 추가 중...');
    try {
        // 먼저 dist 폴더가 존재하는지 확인
        if (!fs.existsSync(DIST_DIR)) {
            console.log('   ⚠️  dist 폴더가 존재하지 않습니다.');
            return;
        }

        // dist 폴더의 모든 파일 추가 (새 파일 포함)
        execSync('git add dist/', {
            stdio: 'pipe',
            cwd: rootDir,
            shell: true
        });

        // 변경된 파일도 강제로 추가
        execSync('git add -f dist/', {
            stdio: 'pipe',
            cwd: rootDir,
            shell: true
        });

        console.log('   ✅ stage 추가 완료\n');
    } catch (error) {
        console.error('   ❌ stage 추가 실패:', error.message);
        process.exit(1);
    }

    // 5. 다시 skip-worktree 설정
    console.log('5️⃣  dist 폴더 변경사항 무시 설정 중...');

    const files = getAllFiles(DIST_DIR);
    if (files.length > 0) {
        const relativeFiles = files.map(f => getRelativePath(f));

        // Git에 추적되고 있는 파일만 필터링
        let trackedFiles = [];
        try {
            const gitFiles = execSync(
                'git ls-files',
                { encoding: 'utf-8', cwd: rootDir, stdio: 'pipe' }
            ).split('\n').map(f => f.trim()).filter(f => f.startsWith('dist/'));

            trackedFiles = relativeFiles.filter(f => gitFiles.includes(f));
        } catch (error) {
            trackedFiles = relativeFiles;
        }

        if (trackedFiles.length > 0) {
            const BATCH_SIZE = 50;
            let successCount = 0;

            for (let i = 0; i < trackedFiles.length; i += BATCH_SIZE) {
                const batch = trackedFiles.slice(i, i + BATCH_SIZE);
                const fileArgs = batch.map(f => `"${f}"`).join(' ');
                const command = `git update-index --skip-worktree ${fileArgs}`;

                try {
                    execSync(command, {
                        stdio: 'pipe',
                        cwd: rootDir,
                        shell: true
                    });
                    successCount += batch.length;
                } catch (error) {
                    // 개별 처리
                    batch.forEach((relativePath) => {
                        try {
                            execSync(`git update-index --skip-worktree "${relativePath}"`, {
                                stdio: 'pipe',
                                cwd: rootDir,
                                shell: true
                            });
                            successCount++;
                        } catch (err) {
                            // 무시
                        }
                    });
                }
            }
            console.log(`   ✅ ${successCount}개 파일 설정 완료\n`);
        }
    }

    console.log('✨ 모든 작업 완료!');
    console.log('💡 이제 "git commit"으로 커밋할 수 있습니다.');
    console.log('💡 dist 폴더의 변경사항은 다시 무시되도록 설정되었습니다.\n');
}

// 명령어 실행
const command = process.argv[2];

switch (command) {
    case 'ignore':
        ignoreDist();
        break;
    case 'track':
        trackDist();
        break;
    case 'status':
        statusDist();
        break;
    case 'build-and-stage':
        buildAndStage();
        break;
    default:
        console.log('사용법:');
        console.log('  node scripts/git-dist-manager.js ignore          - dist 폴더 변경사항 무시 설정');
        console.log('  node scripts/git-dist-manager.js track          - dist 폴더 추적 재개 설정');
        console.log('  node scripts/git-dist-manager.js status          - dist 폴더 추적 상태 확인');
        console.log('  node scripts/git-dist-manager.js build-and-stage - 빌드 후 자동으로 stage 추가 및 무시 설정');
        process.exit(1);
}

