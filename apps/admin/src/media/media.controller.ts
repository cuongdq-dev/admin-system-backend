import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';

@Controller({ path: 'media', version: '1' })
@ApiTags('Media')
// @ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getAllMedia(@Headers('workspaces') workspaces: string) {
    return this.mediaService.getAllMedia({ workspaces });
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', type: 'string' })
  getMedia(@Param('slug') slug: string) {
    return this.mediaService.getMedia(slug);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @UserParam() user: User,
  ) {
    return this.mediaService.uploadMedia(file, user);
  }
}
