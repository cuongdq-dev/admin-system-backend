import { Logger } from '@nestjs/common';

export class BaseLogger {
  protected _logger: Logger;
  constructor(name: string) {
    this._logger = new Logger(name);
  }
}
