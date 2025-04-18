import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DropdownService } from './dropdown.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@app/entities';
import { UserParam } from '@app/decorators';

@ApiTags('dropdown')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'dropdown', version: '1' })
export class DropdownController {
  constructor(private dropdownService: DropdownService) {}

  @Get('')
  getDropdowns(@UserParam() user: User) {
    return this.dropdownService.getDropdowns(user);
  }

  @Get('/sites')
  getSite(@UserParam() user: User) {
    return this.dropdownService.getSites(user);
  }

  @Get('/posts')
  getPosts(@UserParam() user: User) {
    return this.dropdownService.getPosts(user);
  }

  @Get('/categories')
  getCategories(@UserParam() user: User) {
    return this.dropdownService.getCategories(user);
  }

  @Get('/categories/:siteId')
  getCategoriesBySite(
    @Param('siteId') siteId: string,
    @UserParam() user: User,
  ) {
    return this.dropdownService.getCategoriesBySite(siteId, user);
  }
}
