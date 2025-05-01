// media.controller.ts
import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

@Controller({ path: 'media', version: '1' })
@ApiTags('Media')
// @ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getAllMedia() {
    return this.mediaService.getAllMedia();
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
