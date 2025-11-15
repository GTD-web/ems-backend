import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetRevisionRequestsQueryDto } from '@interface/admin/revision-request/dto/get-revision-requests-query.dto';

/**
 * DTO 변환 테스트
 * Query 파라미터가 문자열로 들어올 때 @ToBoolean() 데코레이터가
 * 올바르게 boolean으로 변환하는지 확인합니다.
 */
describe('DTO 변환 테스트', () => {
  describe('GetRevisionRequestsQueryDto - isCompleted 변환', () => {
    it('문자열 "false"를 boolean false로 변환해야 한다', async () => {
      // Given - 문자열 "false"로 전달
      const plain = {
        isCompleted: 'false',
      };

      // When - DTO로 변환
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('문자열 "true"를 boolean true로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: 'true',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(true);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('문자열 "0"을 boolean false로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: '0',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('문자열 "1"을 boolean true로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: '1',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(true);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('undefined일 때는 undefined로 유지해야 한다', async () => {
      // Given
      const plain = {};

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBeUndefined();
    });

    it('null일 때는 boolean false로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: null,
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('빈 문자열 ""을 boolean false로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: '',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('이미 boolean false인 경우 그대로 유지해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: false,
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('이미 boolean true인 경우 그대로 유지해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: true,
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(true);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('대소문자 구분 없이 "FALSE"를 boolean false로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: 'FALSE',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('대소문자 구분 없이 "TRUE"를 boolean true로 변환해야 한다', async () => {
      // Given
      const plain = {
        isCompleted: 'TRUE',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(true);
      expect(typeof dto.isCompleted).toBe('boolean');
    });

    it('알 수 없는 문자열은 boolean false로 변환해야 한다 (기본 동작)', async () => {
      // Given
      const plain = {
        isCompleted: 'unknown',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false); // 알 수 없는 값은 false로 변환
      expect(typeof dto.isCompleted).toBe('boolean');
    });
  });

  describe('GetRevisionRequestsQueryDto - isRead 변환', () => {
    it('문자열 "false"를 boolean false로 변환해야 한다', async () => {
      // Given
      const plain = {
        isRead: 'false',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isRead).toBe(false);
      expect(typeof dto.isRead).toBe('boolean');
    });

    it('문자열 "true"를 boolean true로 변환해야 한다', async () => {
      // Given
      const plain = {
        isRead: 'true',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isRead).toBe(true);
      expect(typeof dto.isRead).toBe('boolean');
    });
  });

  describe('GetRevisionRequestsQueryDto - 실제 쿼리 파라미터 시나리오', () => {
    it('isCompleted=false로 요청했을 때 false가 들어와야 한다', async () => {
      // Given - 실제 HTTP 쿼리 파라미터처럼 문자열로 전달
      const plain = {
        isCompleted: 'false', // Query string은 항상 문자열
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(false);
      expect(dto.isCompleted).not.toBe(true); // ❌ true가 되어서는 안 됨
    });

    it('isCompleted=true로 요청했을 때 true가 들어와야 한다', async () => {
      // Given
      const plain = {
        isCompleted: 'true',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isCompleted).toBe(true);
      expect(dto.isCompleted).not.toBe(false);
    });

    it('여러 필터를 함께 사용할 때도 올바르게 변환되어야 한다', async () => {
      // Given
      const plain = {
        evaluationPeriodId: '123e4567-e89b-12d3-a456-426614174000',
        isRead: 'true',
        isCompleted: 'false',
        step: 'self',
      };

      // When
      const dto = plainToInstance(GetRevisionRequestsQueryDto, plain);
      const errors = await validate(dto);

      // Then
      expect(errors.length).toBe(0);
      expect(dto.isRead).toBe(true);
      expect(dto.isCompleted).toBe(false);
      expect(dto.evaluationPeriodId).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(dto.step).toBe('self');
    });
  });
});
