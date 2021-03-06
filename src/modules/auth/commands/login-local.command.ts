import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { AuthDto } from '@modules/auth/dtos/auth.dto';
import { isMatchedHash } from '@utils/index';
import { UnauthorizedException } from '@nestjs/common';
import { Command } from '@nestjs-architects/typed-cqrs';
import { LoginLocalDto } from '@modules/auth/dtos/login-local.dto';
import { CreateTokenCommand } from './create-token.command';
import { GetUserByEmailQuery } from '@modules/users/queries/get-user-by-email.query';

export class LoginLocalCommand extends Command<AuthDto> {
  constructor(public readonly data: LoginLocalDto) {
    super();
  }
}

@CommandHandler(LoginLocalCommand)
export class LoginLocalHandler
  implements ICommandHandler<LoginLocalCommand, AuthDto>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: LoginLocalCommand): Promise<AuthDto> {
    const { data } = command;

    const user = await this.queryBus.execute(
      new GetUserByEmailQuery(data.email)
    );

    if (!isMatchedHash(user.password, data.password)) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const token = await this.commandBus.execute(new CreateTokenCommand(user));

    return new AuthDto(user.toDto(), token);
  }
}
