import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  const filter = new AllExceptionsFilter(logger as never);

  function run(exception: unknown) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/x', method: 'POST', body: {} }),
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    filter.catch(exception, host);
    const [code] = status.mock.calls[0] as [number];
    const [body] = json.mock.calls[0] as [{ message: string }];
    return { code, body };
  }

  beforeEach(() => jest.clearAllMocks());

  it('maps a body-parser "payload too large" error to 413, not 500', () => {
    const err = Object.assign(new Error('request entity too large'), {
      status: 413,
      type: 'entity.too.large',
    });
    const { code, body } = run(err);
    expect(code).toBe(413);
    expect(body.message).toMatch(/حجم/);
    expect(logger.error).not.toHaveBeenCalled(); // a client error, not a server crash
  });

  it('maps a malformed-JSON error (http-errors 400) to 400', () => {
    const { code } = run(
      Object.assign(new SyntaxError('bad json'), { status: 400 }),
    );
    expect(code).toBe(400);
  });

  it('maps a Mongoose CastError to 400', () => {
    const err = Object.assign(new Error('Cast to ObjectId failed'), {
      name: 'CastError',
    });
    expect(run(err).code).toBe(400);
  });

  it('keeps Nest HttpExceptions as they are', () => {
    expect(run(new BadRequestException('nope')).code).toBe(400);
  });

  it('still reports unknown errors as 500 without leaking details', () => {
    const { code, body } = run(new Error('db password is hunter2'));
    expect(code).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalled();
  });

  it('ignores a non-4xx `status` field on an arbitrary error', () => {
    expect(run(Object.assign(new Error('x'), { status: 200 })).code).toBe(500);
    expect(run(Object.assign(new Error('x'), { status: 'oops' })).code).toBe(
      500,
    );
  });
});
