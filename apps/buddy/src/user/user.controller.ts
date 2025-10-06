import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import { RoleGuard } from '@app/guard/roles.guard';
import { PermissionDetailPipe } from '@app/pipes/permission.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserUpdateDto } from './user.dto';
import { UserService } from './user.service';
@ApiTags('User')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/me')
  @SetMetadata('entity', User)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'get logged in user details' })
  async me(@UserParam() user: User) {
    return this.userService.findMe(user);
  }

  @Patch('/me')
  @ApiResponse({ status: HttpStatus.OK, description: 'Update logged in user' })
  @ApiOperation({ summary: 'update logged in user' })
  async update(@UserParam() user: User, @Body() updateDto: UserUpdateDto) {
    return this.userService.updateProfile(user, updateDto);
  }

  @Delete('/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'delete',
        entity: User,
        relations: ['user_roles', 'user_roles.role'],
      }),
    )
    user: User,
  ) {
    return this.userService.delete(user);
  }
}
