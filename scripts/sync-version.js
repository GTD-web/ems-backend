#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * package.json과 docker-compose.yml의 버전을 동기화하는 스크립트
 * package.json의 버전을 docker-compose.yml의 app 이미지 버전으로 업데이트
 */

function syncVersions() {
  try {
    // package.json 읽기
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageVersion = packageJson.version;

    console.log(`📦 package.json 버전: ${packageVersion}`);

    // docker-compose.yml 읽기
    const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
    let dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

    // docker-compose.yml에서 현재 이미지 버전 찾기
    const imageVersionRegex = /image:\s*corejong\/lumir-evaluation-management-system:([\d.]+)/;
    const match = dockerComposeContent.match(imageVersionRegex);
    
    if (!match) {
      throw new Error('docker-compose.yml에서 이미지 버전을 찾을 수 없습니다.');
    }

    const currentImageVersion = match[1];
    console.log(`🐳 docker-compose.yml 현재 이미지 버전: ${currentImageVersion}`);

    // 버전이 다르면 동기화
    if (packageVersion !== currentImageVersion) {
      console.log(`🔄 버전 동기화 중... (${currentImageVersion} → ${packageVersion})`);
      
      // docker-compose.yml의 이미지 버전을 package.json 버전으로 업데이트
      const updatedContent = dockerComposeContent.replace(
        imageVersionRegex,
        `image: corejong/lumir-evaluation-management-system:${packageVersion}`
      );

      // 파일에 쓰기
      fs.writeFileSync(dockerComposePath, updatedContent, 'utf8');
      
      console.log(`✅ docker-compose.yml 이미지 버전이 ${packageVersion}으로 업데이트되었습니다.`);
    } else {
      console.log(`✅ 버전이 이미 동기화되어 있습니다. (${packageVersion})`);
    }

  } catch (error) {
    console.error('❌ 버전 동기화 중 오류가 발생했습니다:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  syncVersions();
}

module.exports = { syncVersions };
