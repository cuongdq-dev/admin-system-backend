import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DropdownService } from './dropdown.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('dropdown')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'dropdown', version: '1' })
export class DropdownController {
  constructor(private dropdownService: DropdownService) {}

  @Get('')
  getDropdowns() {
    return this.dropdownService.getDropdowns();
  }

  @Get('/sites')
  getSite() {
    return this.dropdownService.getSites();
  }

  @Get('/posts')
  getPosts() {
    return this.dropdownService.getPosts();
  }

  @Get('/categories')
  getCategories() {
    return this.dropdownService.getCategories();
  }

  @Get('/categories/:siteId')
  getCategoriesBySite(@Param('siteId') siteId: string) {
    return this.dropdownService.getCategoriesBySite(siteId);
  }
}
