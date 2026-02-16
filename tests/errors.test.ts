import { describe, it, expect } from 'vitest';
import {
  FleeksError,
  FleeksAPIError,
  FleeksRateLimitError,
  FleeksAuthenticationError,
  FleeksPermissionError,
  FleeksResourceNotFoundError,
  FleeksValidationError,
  FleeksConnectionError,
  FleeksStreamingError,
  FleeksTimeoutError,
} from '../src/errors';

describe('Error Hierarchy', () => {
  it('FleeksError is base error', () => {
    const err = new FleeksError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FleeksError);
    expect(err.name).toBe('FleeksError');
    expect(err.message).toBe('test');
  });

  it('FleeksAPIError extends FleeksError', () => {
    const err = new FleeksAPIError('api error', 500, { detail: 'fail' });
    expect(err).toBeInstanceOf(FleeksError);
    expect(err).toBeInstanceOf(FleeksAPIError);
    expect(err.statusCode).toBe(500);
    expect(err.response).toEqual({ detail: 'fail' });
  });

  it('FleeksRateLimitError has retryAfter', () => {
    const err = new FleeksRateLimitError('rate limited', 30);
    expect(err).toBeInstanceOf(FleeksAPIError);
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(30);
  });

  it('FleeksRateLimitError defaults retryAfter to 60', () => {
    const err = new FleeksRateLimitError('rate limited');
    expect(err.retryAfter).toBe(60);
  });

  it('FleeksAuthenticationError is 401', () => {
    const err = new FleeksAuthenticationError('auth failed');
    expect(err).toBeInstanceOf(FleeksAPIError);
    expect(err.statusCode).toBe(401);
  });

  it('FleeksPermissionError is 403', () => {
    const err = new FleeksPermissionError('forbidden');
    expect(err).toBeInstanceOf(FleeksAPIError);
    expect(err.statusCode).toBe(403);
  });

  it('FleeksResourceNotFoundError is 404', () => {
    const err = new FleeksResourceNotFoundError('not found');
    expect(err).toBeInstanceOf(FleeksAPIError);
    expect(err.statusCode).toBe(404);
  });

  it('FleeksValidationError is 422', () => {
    const err = new FleeksValidationError('invalid');
    expect(err).toBeInstanceOf(FleeksAPIError);
    expect(err.statusCode).toBe(422);
  });

  it('FleeksConnectionError extends FleeksError', () => {
    const err = new FleeksConnectionError('network fail');
    expect(err).toBeInstanceOf(FleeksError);
    expect(err).not.toBeInstanceOf(FleeksAPIError);
  });

  it('FleeksStreamingError extends FleeksError', () => {
    const err = new FleeksStreamingError('socket fail');
    expect(err).toBeInstanceOf(FleeksError);
    expect(err).not.toBeInstanceOf(FleeksAPIError);
  });

  it('FleeksTimeoutError extends FleeksError', () => {
    const err = new FleeksTimeoutError('timed out');
    expect(err).toBeInstanceOf(FleeksError);
    expect(err).not.toBeInstanceOf(FleeksAPIError);
  });

  it('all errors are catchable as FleeksError', () => {
    const errors = [
      new FleeksAPIError('api'),
      new FleeksRateLimitError('rate'),
      new FleeksAuthenticationError('auth'),
      new FleeksPermissionError('perm'),
      new FleeksResourceNotFoundError('notfound'),
      new FleeksValidationError('invalid'),
      new FleeksConnectionError('conn'),
      new FleeksStreamingError('stream'),
      new FleeksTimeoutError('timeout'),
    ];

    for (const err of errors) {
      expect(err).toBeInstanceOf(FleeksError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
