import { describe, it, expect } from 'vitest';
import { toCamelCase, toSnakeCase } from '../../src/utils/case';

describe('Case Conversion Utils', () => {
  describe('toCamelCase', () => {
    it('should convert snake_case keys to camelCase', () => {
      const input = {
        project_id: 'abc',
        container_id: 'xyz',
        created_at: '2025-01-01',
      };

      const result = toCamelCase(input);
      expect(result).toEqual({
        projectId: 'abc',
        containerId: 'xyz',
        createdAt: '2025-01-01',
      });
    });

    it('should handle nested objects', () => {
      const input = {
        project_id: 'abc',
        resource_limits: {
          max_cpu: 4,
          max_memory_mb: 1024,
        },
      };

      const result = toCamelCase(input);
      expect(result).toEqual({
        projectId: 'abc',
        resourceLimits: {
          maxCpu: 4,
          maxMemoryMb: 1024,
        },
      });
    });

    it('should handle arrays', () => {
      const input = {
        items: [
          { item_name: 'a', item_value: 1 },
          { item_name: 'b', item_value: 2 },
        ],
      };

      const result = toCamelCase(input);
      expect(result).toEqual({
        items: [
          { itemName: 'a', itemValue: 1 },
          { itemName: 'b', itemValue: 2 },
        ],
      });
    });

    it('should handle null and undefined', () => {
      expect(toCamelCase(null as any)).toBeNull();
      expect(toCamelCase(undefined as any)).toBeUndefined();
    });

    it('should preserve keys without underscores', () => {
      const input = { name: 'test', status: 'active' };
      const result = toCamelCase(input);
      expect(result).toEqual({ name: 'test', status: 'active' });
    });
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase keys to snake_case', () => {
      const input = {
        projectId: 'abc',
        containerId: 'xyz',
        createdAt: '2025-01-01',
      };

      const result = toSnakeCase(input);
      expect(result).toEqual({
        project_id: 'abc',
        container_id: 'xyz',
        created_at: '2025-01-01',
      });
    });

    it('should handle nested objects', () => {
      const input = {
        projectId: 'abc',
        resourceLimits: {
          maxCpu: 4,
          maxMemoryMb: 1024,
        },
      };

      const result = toSnakeCase(input);
      expect(result).toEqual({
        project_id: 'abc',
        resource_limits: {
          max_cpu: 4,
          max_memory_mb: 1024,
        },
      });
    });

    it('should handle arrays with objects', () => {
      const input = {
        items: [
          { itemName: 'a' },
          { itemName: 'b' },
        ],
      };

      const result = toSnakeCase(input);
      expect(result).toEqual({
        items: [
          { item_name: 'a' },
          { item_name: 'b' },
        ],
      });
    });

    it('should be the inverse of toCamelCase', () => {
      const original = {
        project_id: 'abc',
        container_id: 'xyz',
        resource_limits: { max_cpu: 4 },
      };

      const camel = toCamelCase(original);
      const backToSnake = toSnakeCase(camel as Record<string, unknown>);
      expect(backToSnake).toEqual(original);
    });
  });
});
